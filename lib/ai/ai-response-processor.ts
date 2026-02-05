/**
 * AI Response Processor - Phase 4
 * 
 * Processes AI responses with intelligent patch application.
 * Handles patch failures and retries with proper context.
 */

import { FileEditingIntelligence } from './file-editing-intelligence'
import { PatchOperation, PatchResult } from './file-editing-intelligence'
import { PatchApplicationUtility } from './patch-application-utility'
import { VirtualFilesystemLayer } from './virtual-filesystem'
import { securityAudit } from '@/lib/security/audit-logger'

// AI Response Types
export type AIResponseType = 'full_rewrite' | 'patch_based' | 'invalid'

// Processed AI Response Interface
export interface ProcessedAIResponse {
  type: AIResponseType
  filePath: string
  strategy: 'patch' | 'rewrite'
  patchOperations?: PatchOperation[]
  newContent?: string
  confidence: number
  reasons: string[]
}

/**
 * AI Response Processor Class
 */
export class AIResponseProcessor {
  private fileEditingIntelligence: FileEditingIntelligence
  
  constructor(virtualFilesystem: VirtualFilesystemLayer) {
    this.fileEditingIntelligence = new FileEditingIntelligence(virtualFilesystem)
  }
  
  /**
   * Process AI response and determine optimal strategy
   */
  processAIResponse(filePath: string, aiResponse: string): ProcessedAIResponse {
    securityAudit.logAccessAttempt('ai_response_processing', filePath)
    
    // Parse the AI response to extract content
    const parsedResponse = this.parseAIResponse(aiResponse)
    
    if (parsedResponse.type === 'invalid') {
      return {
        type: 'invalid',
        filePath,
        strategy: 'rewrite',
        confidence: 0,
        reasons: ['Invalid AI response format']
      }
    }
    
    const currentFile = this.fileEditingIntelligence['vfs'].getFile(filePath)
    const currentContent = currentFile ? currentFile.content : ''
    const newContent = parsedResponse.content
    
    // Analyze the optimal edit strategy
    const strategyAnalysis = this.fileEditingIntelligence.analyzeEditStrategy(filePath, newContent)
    
    return {
      type: 'patch_based', // or full_rewrite depending on analysis
      filePath,
      strategy: strategyAnalysis.strategy,
      newContent: parsedResponse.type === 'full_rewrite' ? newContent : undefined,
      patchOperations: strategyAnalysis.strategy === 'patch' ? 
        this.fileEditingIntelligence.generateMinimalPatch(filePath, currentContent, newContent) : 
        undefined,
      confidence: strategyAnalysis.confidence,
      reasons: strategyAnalysis.reasons
    }
  }
  
  /**
   * Apply AI changes with intelligent handling
   */
  async applyAIChanges(filePath: string, processedResponse: ProcessedAIResponse): Promise<{
    success: boolean
    applied: boolean
    results: PatchResult[]
    wasRewrite: boolean
    error?: string
  }> {
    securityAudit.logAccessAttempt('ai_changes_applying', filePath)
    
    if (processedResponse.type === 'invalid') {
      return {
        success: false,
        applied: false,
        results: [],
        wasRewrite: false,
        error: 'Invalid AI response'
      }
    }
    
    try {
      if (processedResponse.strategy === 'patch' && processedResponse.patchOperations) {
        // Apply patches
        const results = await this.applyPatchesWithRetry(filePath, processedResponse.patchOperations)
        
        // Check if all patches succeeded
        const allSuccessful = results.every(r => r.success && r.applied)
        
        if (allSuccessful) {
          return {
            success: true,
            applied: true,
            results,
            wasRewrite: false
          }
        } else {
          // Some patches failed, handle failure according to Phase 4 requirements
          securityAudit.logViolationBlocked(
            'patch_failure',
            filePath,
            { failedPatches: results.filter(r => !r.success).length }
          )
          
          // According to Phase 4: "If patch fails: Reload latest file, Re-ask model with updated context"
          // For now, we'll return the results and indicate retry is needed
          return {
            success: false,
            applied: false,
            results,
            wasRewrite: false,
            error: `Some patches failed. ${results.filter(r => !r.success).length} of ${results.length} patches failed.`
          }
        }
      } else if (processedResponse.newContent) {
        // Apply full rewrite
        const result = await this.fileEditingIntelligence.updateFileWithMinimalChanges(
          filePath, 
          processedResponse.newContent
        )
        
        return {
          success: result.success,
          applied: result.success,
          results: [], // No specific patch results for rewrite
          wasRewrite: result.wasRewrite,
          error: result.success ? undefined : 'Failed to update file'
        }
      } else {
        return {
          success: false,
          applied: false,
          results: [],
          wasRewrite: false,
          error: 'No content to apply'
        }
      }
    } catch (error) {
      securityAudit.logViolationBlocked(
        'ai_changes_error',
        filePath,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
      
      return {
        success: false,
        applied: false,
        results: [],
        wasRewrite: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Apply patches with retry logic for failure handling
   */
  private async applyPatchesWithRetry(filePath: string, patches: PatchOperation[], maxRetries: number = 3): Promise<PatchResult[]> {
    const results: PatchResult[] = []
    
    for (const patch of patches) {
      let retryCount = 0
      let patchResult: PatchResult
      
      do {
        // Reload latest file content (in case it was modified externally)
        await this.fileEditingIntelligence['vfs'].loadFile(filePath)
        
        // Apply the patch
        patchResult = PatchApplicationUtility.applyPatchWithContext(
          this.fileEditingIntelligence['vfs'].getFile(filePath)?.content || '',
          PatchApplicationUtility.normalizePatch(patch)
        )
        
        if (!patchResult.success) {
          securityAudit.logViolationBlocked(
            'patch_retry',
            filePath,
            { retryCount, error: patchResult.error }
          )
          
          retryCount++
          
          // Wait a bit before retrying
          if (retryCount <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 100 * retryCount))
          }
        }
      } while (!patchResult.success && retryCount < maxRetries)
      
      results.push(patchResult)
      
      // If patch failed after all retries, stop applying further patches
      if (!patchResult.success) {
        break
      }
    }
    
    return results
  }
  
  /**
   * Parse AI response to extract content and determine type
   */
  private parseAIResponse(response: string): {
    type: AIResponseType
    content: string
    metadata?: any
  } {
    try {
      // Clean the response (remove markdown if present)
      let cleanResponse = response.trim()
      
      if (cleanResponse.startsWith('```') && cleanResponse.endsWith('```')) {
        // Extract content from code block
        const lines = cleanResponse.split('\n')
        cleanResponse = lines.slice(1, -1).join('\n')
      }
      
      // Check if this looks like a full file rewrite
      // If it contains typical file structure (imports, exports, etc.) it's likely a full rewrite
      if (this.isLikelyFullRewrite(cleanResponse)) {
        return {
          type: 'full_rewrite',
          content: cleanResponse
        }
      }
      
      // For now, treat as patch-based if not clearly a full rewrite
      // In a real implementation, this would parse structured patch formats
      return {
        type: 'patch_based',
        content: cleanResponse
      }
      
    } catch (error) {
      return {
        type: 'invalid',
        content: ''
      }
    }
  }
  
  /**
   * Determine if content looks like a full file rewrite
   */
  private isLikelyFullRewrite(content: string): boolean {
    const lines = content.split('\n')
    
    // Check for common file structure indicators
    const hasImport = lines.some(line => 
      line.trim().startsWith('import ') || 
      line.trim().startsWith('const ') && line.includes('= require(') ||
      line.trim().startsWith('using ')
    )
    
    const hasExport = lines.some(line => 
      line.trim().startsWith('export ') || 
      line.trim().startsWith('module.exports') ||
      line.trim().endsWith('}') && (line.includes('function') || line.includes('class'))
    )
    
    const hasClassOrFunction = lines.some(line => 
      line.trim().startsWith('function ') || 
      line.trim().startsWith('class ') ||
      line.trim().includes('=>') && (line.includes('(') || line.includes('{'))
    )
    
    // If it has imports/exports or class/function definitions, likely a full rewrite
    return hasImport || hasExport || hasClassOrFunction
  }
  
  /**
   * Handle patch failure according to Phase 4 requirements
   */
  async handlePatchFailure(filePath: string, error: string): Promise<{
    success: boolean
    needsRegeneration: boolean
    message: string
  }> {
    securityAudit.logViolationBlocked(
      'patch_failure_handled',
      filePath,
      { error }
    )
    
    // According to Phase 4: "If patch fails: Reload latest file, Re-ask model with updated context"
    // Reload the latest file content
    try {
      await this.fileEditingIntelligence['vfs'].loadFile(filePath)
      
      return {
        success: true,
        needsRegeneration: true, // Indicate that the AI model should be re-asked with updated context
        message: `Patch failed: ${error}. File reloaded with latest content. AI model should be re-asked with updated context.`
      }
    } catch (reloadError) {
      return {
        success: false,
        needsRegeneration: true,
        message: `Patch failed: ${error}. Could not reload file: ${reloadError instanceof Error ? reloadError.message : 'Unknown error'}. AI model should be re-asked with updated context.`
      }
    }
  }
  
  /**
   * Get the file editing intelligence instance
   */
  getFileEditingIntelligence(): FileEditingIntelligence {
    return this.fileEditingIntelligence
  }
}

// Export for use in other modules