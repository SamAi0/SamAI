/**
 * File Editing Intelligence - Phase 4
 * 
 * Implements intelligent patch-based updates with failure handling.
 * Prefer minimal changes over full rewrites.
 */

import { VirtualFilesystemLayer, VirtualFile } from './virtual-filesystem'
import { securityAudit } from '@/lib/security/audit-logger'
import { validateWorkspacePath } from '@/lib/security/file-access-control.node'

// Patch Operation Interface
export interface PatchOperation {
  type: 'insert' | 'delete' | 'replace'
  startLine: number
  endLine?: number
  content: string
  description: string
}

// Patch Result Interface
export interface PatchResult {
  success: boolean
  applied: boolean
  error?: string
  originalContent: string
  patchedContent: string
  patch: PatchOperation
  retryNeeded: boolean
}

// File Editing Intelligence Configuration
export interface FileEditingConfig {
  maxRetries: number
  preferPatches: boolean
  minChunkSize: number
  maxContextLines: number
}

/**
 * File Editing Intelligence Class
 */
export class FileEditingIntelligence {
  private config: FileEditingConfig
  private vfs: VirtualFilesystemLayer
  
  constructor(virtualFilesystem: VirtualFilesystemLayer, config?: Partial<FileEditingConfig>) {
    this.config = {
      maxRetries: config?.maxRetries ?? 3,
      preferPatches: config?.preferPatches ?? true,
      minChunkSize: config?.minChunkSize ?? 5,
      maxContextLines: config?.maxContextLines ?? 10
    }
    this.vfs = virtualFilesystem
  }
  
  /**
   * Apply a patch to a file
   */
  async applyPatch(filePath: string, patch: PatchOperation): Promise<PatchResult> {
    validateWorkspacePath(filePath, 'patch_application')
    
    const file = this.vfs.getFile(filePath)
    if (!file) {
      return {
        success: false,
        applied: false,
        error: `File not loaded: ${filePath}`,
        originalContent: '',
        patchedContent: '',
        patch,
        retryNeeded: false
      }
    }
    
    const originalContent = file.content
    let patchedContent = originalContent
    
    try {
      const lines = originalContent.split('\n')
      
      switch (patch.type) {
        case 'insert':
          // Insert content at the specified line
          const insertIndex = Math.min(patch.startLine - 1, lines.length)
          lines.splice(insertIndex, 0, patch.content)
          patchedContent = lines.join('\n')
          break
          
        case 'delete':
          // Delete lines from startLine to endLine
          if (patch.endLine === undefined) {
            patch.endLine = patch.startLine
          }
          const deleteStart = Math.max(0, patch.startLine - 1)
          const deleteEnd = Math.min(lines.length, patch.endLine)
          lines.splice(deleteStart, deleteEnd - deleteStart)
          patchedContent = lines.join('\n')
          break
          
        case 'replace':
          // Replace lines from startLine to endLine with new content
          if (patch.endLine === undefined) {
            patch.endLine = patch.startLine
          }
          const replaceStart = Math.max(0, patch.startLine - 1)
          const replaceEnd = Math.min(lines.length, patch.endLine)
          lines.splice(replaceStart, replaceEnd - replaceStart, patch.content)
          patchedContent = lines.join('\n')
          break
          
        default:
          return {
            success: false,
            applied: false,
            error: `Unknown patch type: ${(patch as any).type}`,
            originalContent,
            patchedContent: originalContent,
            patch,
            retryNeeded: false
          }
      }
      
      // Update the virtual file
      this.vfs.updateFile(filePath, patchedContent)
      
      return {
        success: true,
        applied: true,
        originalContent,
        patchedContent,
        patch,
        retryNeeded: false
      }
      
    } catch (error) {
      return {
        success: false,
        applied: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        originalContent,
        patchedContent: originalContent,
        patch,
        retryNeeded: true
      }
    }
  }
  
  /**
   * Apply multiple patches to a file
   */
  async applyPatches(filePath: string, patches: PatchOperation[]): Promise<PatchResult[]> {
    const results: PatchResult[] = []
    
    for (const patch of patches) {
      const result = await this.applyPatch(filePath, patch)
      results.push(result)
      
      // If a patch fails, stop applying further patches
      if (!result.success) {
        break
      }
    }
    
    return results
  }
  
  /**
   * Generate minimal patch from old and new content
   */
  generateMinimalPatch(filePath: string, oldContent: string, newContent: string): PatchOperation[] {
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')
    
    const patches: PatchOperation[] = []
    
    // Find differences using a simple algorithm
    const maxLines = Math.max(oldLines.length, newLines.length)
    let i = 0
    
    while (i < maxLines) {
      if (i >= oldLines.length) {
        // Content was added at the end
        const addedLines = newLines.slice(i).join('\n')
        patches.push({
          type: 'insert',
          startLine: i + 1,
          content: addedLines,
          description: `Append content at line ${i + 1}`
        })
        break
      } else if (i >= newLines.length) {
        // Content was removed from the end
        patches.push({
          type: 'delete',
          startLine: i + 1,
          endLine: oldLines.length,
          content: '',
          description: `Remove lines ${i + 1}-${oldLines.length}`
        })
        break
      } else if (oldLines[i] !== newLines[i]) {
        // Find the range of different lines
        let j = i
        while (j < maxLines && (j >= oldLines.length || j >= newLines.length || oldLines[j] !== newLines[j])) {
          j++
        }
        
        // Determine if it's an insert, delete, or replace
        const oldCount = j - i
        const newCount = j < newLines.length ? j - i : newLines.length - i
        
        if (oldCount === 0) {
          // Insert operation
          const content = newLines.slice(i, j).join('\n')
          patches.push({
            type: 'insert',
            startLine: i + 1,
            content,
            description: `Insert content at line ${i + 1}`
          })
        } else if (newCount === 0) {
          // Delete operation
          patches.push({
            type: 'delete',
            startLine: i + 1,
            endLine: j,
            content: '',
            description: `Delete lines ${i + 1}-${j}`
          })
        } else {
          // Replace operation
          const content = newLines.slice(i, j).join('\n')
          patches.push({
            type: 'replace',
            startLine: i + 1,
            endLine: j,
            content,
            description: `Replace lines ${i + 1}-${j}`
          })
        }
        
        i = j
      } else {
        i++
      }
    }
    
    return patches
  }
  
  /**
   * Update file with minimal changes (prefer patches over full rewrite)
   */
  async updateFileWithMinimalChanges(filePath: string, newContent: string): Promise<{
    success: boolean
    patchesApplied: number
    patchResults: PatchResult[]
    wasRewrite: boolean
  }> {
    validateWorkspacePath(filePath, 'minimal_update')
    
    const file = this.vfs.getFile(filePath)
    if (!file) {
      // File doesn't exist, create it
      this.vfs.createFile(filePath, newContent)
      return {
        success: true,
        patchesApplied: 0,
        patchResults: [],
        wasRewrite: true
      }
    }
    
    const originalContent = file.content
    
    // If prefer patches is enabled, try to generate and apply minimal patches
    if (this.config.preferPatches) {
      const patches = this.generateMinimalPatch(filePath, originalContent, newContent)
      
      if (patches.length > 0) {
        const results = await this.applyPatches(filePath, patches)
        const successfulPatches = results.filter(r => r.success && r.applied)
        
        if (successfulPatches.length === patches.length) {
          // All patches applied successfully
          return {
            success: true,
            patchesApplied: successfulPatches.length,
            patchResults: results,
            wasRewrite: false
          }
        } else {
          // Some patches failed, fall back to full rewrite
          securityAudit.logViolationBlocked(
            'patch_failure',
            filePath,
            { failedPatches: results.filter(r => !r.success).length }
          )
        }
      }
    }
    
    // Fall back to full rewrite if patches aren't preferred or failed
    this.vfs.updateFile(filePath, newContent)
    
    return {
      success: true,
      patchesApplied: 0,
      patchResults: [],
      wasRewrite: true
    }
  }
  
  /**
   * Handle patch failure with retry logic
   */
  async handlePatchFailure(
    filePath: string,
    patch: PatchOperation,
    error: string,
    retryCount: number = 0
  ): Promise<PatchResult> {
    securityAudit.logViolationBlocked(
      'patch_failure_handling',
      filePath,
      { error, retryCount }
    )
    
    if (retryCount >= this.config.maxRetries) {
      return {
        success: false,
        applied: false,
        error: `Max retries exceeded. Last error: ${error}`,
        originalContent: '',
        patchedContent: '',
        patch,
        retryNeeded: false
      }
    }
    
    // Reload the latest file content (in case it was modified externally)
    await this.vfs.loadFile(filePath)
    
    // Return result indicating retry is needed
    return {
      success: false,
      applied: false,
      error: `Patch failed, retry ${retryCount + 1}/${this.config.maxRetries}: ${error}`,
      originalContent: this.vfs.getFile(filePath)?.content || '',
      patchedContent: this.vfs.getFile(filePath)?.content || '',
      patch,
      retryNeeded: true
    }
  }
  
  /**
   * Analyze file to suggest optimal edit strategy
   */
  analyzeEditStrategy(filePath: string, proposedChanges: string): {
    strategy: 'patch' | 'rewrite'
    confidence: number
    suggestedOperations: PatchOperation[]
    reasons: string[]
  } {
    const file = this.vfs.getFile(filePath)
    if (!file) {
      return {
        strategy: 'rewrite',
        confidence: 1.0,
        suggestedOperations: [],
        reasons: ['File does not exist, rewrite required']
      }
    }
    
    const originalLines = file.content.split('\n')
    const proposedLines = proposedChanges.split('\n')
    
    // Calculate similarity
    const commonLines = originalLines.filter(line => proposedLines.includes(line))
    const similarity = commonLines.length / Math.max(originalLines.length, proposedLines.length, 1)
    
    // Generate potential patches
    const patches = this.generateMinimalPatch(filePath, file.content, proposedChanges)
    
    // Decide strategy based on analysis
    if (similarity > 0.7 && patches.length > 0) {
      // High similarity and patches available - prefer patching
      return {
        strategy: 'patch',
        confidence: similarity,
        suggestedOperations: patches,
        reasons: [
          `High content similarity (${Math.round(similarity * 100)}%)`,
          `${patches.length} patches identified`,
          'Most content unchanged'
        ]
      }
    } else if (patches.length === 1 && patches[0].type === 'insert' && patches[0].startLine >= originalLines.length) {
      // Appending content - definitely use patch
      return {
        strategy: 'patch',
        confidence: 0.9,
        suggestedOperations: patches,
        reasons: ['Appending to end of file']
      }
    } else {
      // Low similarity - rewrite might be better
      return {
        strategy: 'rewrite',
        confidence: 1 - similarity,
        suggestedOperations: patches,
        reasons: [
          `Low content similarity (${Math.round((1 - similarity) * 100)}%)`,
          'Significant structural changes detected'
        ]
      }
    }
  }
  
  /**
   * Get configuration
   */
  getConfig(): FileEditingConfig {
    return { ...this.config }
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FileEditingConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Export for use in other modules