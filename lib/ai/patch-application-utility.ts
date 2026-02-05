/**
 * Patch Application Utility - Phase 4
 * 
 * Handles the safe application of patches with validation and fallbacks.
 * Implements proper error handling to prevent silent overwrites.
 */

import { PatchOperation, PatchResult } from './file-editing-intelligence'

// Context Matching Interface
interface ContextMatch {
  startLine: number
  endLine: number
  confidence: number
  contextBefore: string[]
  contextAfter: string[]
}

/**
 * Patch Application Utility Class
 */
export class PatchApplicationUtility {
  /**
   * Apply a patch with context validation
   */
  static applyPatchWithContext(content: string, patch: PatchOperation): PatchResult {
    const lines = content.split('\n')
    let patchedLines = [...lines]
    
    try {
      // Validate patch bounds
      if (patch.startLine < 1 || patch.startLine > lines.length + 1) {
        return {
          success: false,
          applied: false,
          error: `Start line ${patch.startLine} is out of bounds (file has ${lines.length} lines)`,
          originalContent: content,
          patchedContent: content,
          patch,
          retryNeeded: true
        }
      }
      
      if (patch.endLine !== undefined && (patch.endLine < patch.startLine || patch.endLine > lines.length)) {
        return {
          success: false,
          applied: false,
          error: `End line ${patch.endLine} is invalid for start line ${patch.startLine} (file has ${lines.length} lines)`,
          originalContent: content,
          patchedContent: content,
          patch,
          retryNeeded: true
        }
      }
      
      switch (patch.type) {
        case 'insert':
          // Insert content at the specified line
          const insertIndex = patch.startLine - 1
          const contentLines = patch.content.split('\n')
          patchedLines.splice(insertIndex, 0, ...contentLines)
          break
          
        case 'delete':
          // Delete lines from startLine to endLine
          const deleteStart = Math.max(0, patch.startLine - 1)
          const deleteEnd = patch.endLine !== undefined 
            ? Math.min(lines.length, patch.endLine) 
            : deleteStart + 1
          const deleteCount = deleteEnd - deleteStart
          patchedLines.splice(deleteStart, deleteCount)
          break
          
        case 'replace':
          // Replace lines from startLine to endLine with new content
          const replaceStart = Math.max(0, patch.startLine - 1)
          const replaceEnd = patch.endLine !== undefined 
            ? Math.min(lines.length, patch.endLine) 
            : replaceStart + 1
          const replaceCount = replaceEnd - replaceStart
          const replaceContentLines = patch.content.split('\n')
          patchedLines.splice(replaceStart, replaceCount, ...replaceContentLines)
          break
          
        default:
          return {
            success: false,
            applied: false,
            error: `Unknown patch type: ${(patch as any).type}`,
            originalContent: content,
            patchedContent: content,
            patch,
            retryNeeded: true
          }
      }
      
      const patchedContent = patchedLines.join('\n')
      
      return {
        success: true,
        applied: true,
        originalContent: content,
        patchedContent,
        patch,
        retryNeeded: false
      }
      
    } catch (error) {
      return {
        success: false,
        applied: false,
        error: error instanceof Error ? error.message : 'Unknown error during patch application',
        originalContent: content,
        patchedContent: content,
        patch,
        retryNeeded: true
      }
    }
  }
  
  /**
   * Find best context match for a patch
   */
  static findContextMatch(content: string, patch: PatchOperation): ContextMatch | null {
    const lines = content.split('\n')
    const patchContentLines = patch.content.split('\n')
    
    // Look for the best matching position based on context
    for (let i = 0; i < lines.length; i++) {
      let matchScore = 0
      let bestMatch: ContextMatch | null = null
      
      // Check if this position matches the patch context
      if (patch.type === 'replace' && patch.endLine) {
        // For replace patches, check if the lines to be replaced match
        const linesToReplace = Math.min(patch.endLine - patch.startLine + 1, lines.length - i)
        let linesMatch = 0
        
        for (let j = 0; j < linesToReplace; j++) {
          if (i + j < lines.length) {
            // Compare context around the line
            if (lines[i + j] && patchContentLines[j]) {
              if (lines[i + j].trim() === patchContentLines[j].trim()) {
                linesMatch++
              }
            }
          }
        }
        
        matchScore = linesMatch / linesToReplace
        if (matchScore > 0.5) { // At least 50% match
          bestMatch = {
            startLine: i + 1,
            endLine: i + linesToReplace,
            confidence: matchScore,
            contextBefore: lines.slice(Math.max(0, i - 2), i),
            contextAfter: lines.slice(i + linesToReplace, i + linesToReplace + 2)
          }
        }
      } else if (patch.type === 'delete' && patch.endLine) {
        // For delete patches, check if the lines to delete exist
        const linesToDelete = Math.min(patch.endLine - patch.startLine + 1, lines.length - i)
        let linesMatch = 0
        
        for (let j = 0; j < linesToDelete; j++) {
          if (i + j < lines.length && lines[i + j].includes(patchContentLines[0])) {
            linesMatch++
          }
        }
        
        matchScore = linesMatch / linesToDelete
        if (matchScore > 0.3) {
          bestMatch = {
            startLine: i + 1,
            endLine: i + linesToDelete,
            confidence: matchScore,
            contextBefore: lines.slice(Math.max(0, i - 2), i),
            contextAfter: lines.slice(i + linesToDelete, i + linesToDelete + 2)
          }
        }
      } else if (patch.type === 'insert') {
        // For insert patches, look for context around the insertion point
        const contextBefore = lines.slice(Math.max(0, i - 2), i)
        const contextAfter = lines.slice(i, Math.min(lines.length, i + 2))
        
        // Score based on how well the patch content fits
        let contentFitScore = 0
        if (contextBefore.length > 0) {
          // Check if patch content logically follows the context
          const lastContextLine = contextBefore[contextBefore.length - 1]
          if (lastContextLine && patch.content.includes(lastContextLine)) {
            contentFitScore += 0.3
          }
        }
        
        if (contextAfter.length > 0) {
          // Check if patch content logically precedes the following context
          const firstFollowingLine = contextAfter[0]
          if (firstFollowingLine && patch.content.includes(firstFollowingLine)) {
            contentFitScore += 0.3
          }
        }
        
        matchScore = contentFitScore
        if (matchScore > 0.2) {
          bestMatch = {
            startLine: i + 1,
            endLine: i + 1,
            confidence: matchScore,
            contextBefore,
            contextAfter
          }
        }
      }
      
      if (bestMatch && bestMatch.confidence > 0.5) {
        return bestMatch
      }
    }
    
    return null
  }
  
  /**
   * Validate patch against current file content
   */
  static validatePatch(content: string, patch: PatchOperation): {
    isValid: boolean
    error?: string
    suggestedAdjustments?: Partial<PatchOperation>
  } {
    const lines = content.split('\n')
    
    // Check bounds
    if (patch.startLine < 1 || patch.startLine > lines.length + 1) {
      return {
        isValid: false,
        error: `Start line ${patch.startLine} is out of bounds (file has ${lines.length} lines)`
      }
    }
    
    if (patch.endLine !== undefined) {
      if (patch.endLine < patch.startLine) {
        return {
          isValid: false,
          error: `End line ${patch.endLine} is before start line ${patch.startLine}`
        }
      }
      if (patch.endLine > lines.length) {
        // Adjust end line to fit within file
        return {
          isValid: true,
          suggestedAdjustments: {
            ...patch,
            endLine: lines.length
          }
        }
      }
    }
    
    // For replace/delete operations, check if the target lines exist
    if ((patch.type === 'replace' || patch.type === 'delete') && patch.endLine) {
      const targetLines = lines.slice(patch.startLine - 1, patch.endLine)
      if (targetLines.length === 0) {
        return {
          isValid: false,
          error: `Target lines ${patch.startLine}-${patch.endLine} do not exist in file`
        }
      }
    }
    
    return { isValid: true }
  }
  
  /**
   * Normalize patch to ensure consistent format
   */
  static normalizePatch(patch: PatchOperation): PatchOperation {
    return {
      type: patch.type,
      startLine: Math.max(1, Math.floor(patch.startLine)),
      endLine: patch.endLine !== undefined ? Math.max(1, Math.floor(patch.endLine)) : undefined,
      content: patch.content || '',
      description: patch.description || `Auto-generated ${patch.type} patch`
    }
  }
  
  /**
   * Create a reverse patch (undo operation)
   */
  static createReversePatch(originalContent: string, patchedContent: string, patch: PatchOperation): PatchOperation | null {
    // This is a simplified implementation
    // A full implementation would require a more sophisticated diff algorithm
    switch (patch.type) {
      case 'insert':
        // Reverse of insert is delete
        return {
          type: 'delete',
          startLine: patch.startLine,
          endLine: patch.startLine + patch.content.split('\n').length - 1,
          content: '',
          description: `Undo insert operation`
        }
      case 'delete':
        // Reverse of delete is insert
        return {
          type: 'insert',
          startLine: patch.startLine,
          content: originalContent.split('\n').slice(patch.startLine - 1, patch.endLine).join('\n'),
          description: `Undo delete operation`
        }
      case 'replace':
        // Reverse of replace is another replace
        return {
          type: 'replace',
          startLine: patch.startLine,
          endLine: patch.endLine,
          content: originalContent.split('\n').slice(patch.startLine - 1, patch.endLine).join('\n'),
          description: `Undo replace operation`
        }
      default:
        return null
    }
  }
  
  /**
   * Calculate patch confidence score
   */
  static calculateConfidence(content: string, patch: PatchOperation): number {
    const lines = content.split('\n')
    let score = 0
    
    // Base score based on line bounds
    if (patch.startLine >= 1 && patch.startLine <= lines.length + 1) {
      score += 0.3
    }
    
    // Additional score for context matching
    const contextMatch = this.findContextMatch(content, patch)
    if (contextMatch) {
      score += contextMatch.confidence * 0.4
    }
    
    // Score for content relevance
    if (patch.content && patch.content.length > 0) {
      // Check if patch content relates to surrounding context
      const contextBefore = lines.slice(Math.max(0, patch.startLine - 3), patch.startLine - 1)
      const contextAfter = lines.slice(patch.startLine - 1, Math.min(lines.length, patch.startLine + 2))
      
      const allContext = [...contextBefore, ...contextAfter].join(' ').toLowerCase()
      const patchContent = patch.content.toLowerCase()
      
      if (allContext.includes(patchContent.substring(0, 20))) {
        score += 0.3
      }
    }
    
    return Math.min(1.0, score)
  }
}

// Export for use in other modules