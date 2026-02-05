/**
 * Trust System - Phase 2
 * 
 * Manages the accept/reject workflow for AI-generated changes.
 * Provides UI integration and change management.
 */

import { VirtualFilesystemLayer } from './virtual-filesystem'
import { DiffPreviewGenerator, PreviewContent } from './diff-preview-generator'
import { securityAudit } from '@/lib/security/audit-logger'

// Trust Decision Types
export type TrustDecision = 'accept' | 'reject' | 'partial' | 'pending'

// Change Request Interface
export interface ChangeRequest {
  id: string
  taskId: string
  userId: string
  timestamp: Date
  vfs: VirtualFilesystemLayer
  previewGenerator: DiffPreviewGenerator
  status: TrustDecision
  decisions: Map<string, TrustDecision>
  createdAt: Date
  updatedAt: Date
}

// Decision Event Interface
export interface DecisionEvent {
  requestId: string
  filePath: string
  decision: TrustDecision
  timestamp: Date
  userId: string
}

/**
 * Trust System Class
 */
export class TrustSystem {
  private requests: Map<string, ChangeRequest> = new Map()
  private decisionHistory: DecisionEvent[] = []
  
  /**
   * Create a new change request
   */
  createChangeRequest(
    taskId: string,
    userId: string,
    vfs: VirtualFilesystemLayer
  ): ChangeRequest {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const previewGenerator = new DiffPreviewGenerator(vfs)
    
    const changeRequest: ChangeRequest = {
      id: requestId,
      taskId,
      userId,
      timestamp: new Date(),
      vfs,
      previewGenerator,
      status: 'pending',
      decisions: new Map(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.requests.set(requestId, changeRequest)
    securityAudit.logAccessAttempt('trust_request_created', requestId, userId)
    
    return changeRequest
  }
  
  /**
   * Get change request by ID
   */
  getChangeRequest(requestId: string): ChangeRequest | undefined {
    return this.requests.get(requestId)
  }
  
  /**
   * Get all change requests for a user
   */
  getUserRequests(userId: string): ChangeRequest[] {
    return Array.from(this.requests.values()).filter(req => req.userId === userId)
  }
  
  /**
   * Make decision on a file
   */
  makeDecision(
    requestId: string,
    filePath: string,
    decision: TrustDecision,
    userId: string
  ): { success: boolean; message: string } {
    const request = this.requests.get(requestId)
    if (!request) {
      return { success: false, message: 'Change request not found' }
    }
    
    if (request.userId !== userId) {
      return { success: false, message: 'Unauthorized' }
    }
    
    // Validate that file exists in VFS
    const file = request.vfs.getFile(filePath)
    if (!file) {
      return { success: false, message: 'File not found in change request' }
    }
    
    // Record decision
    request.decisions.set(filePath, decision)
    request.updatedAt = new Date()
    
    // Log decision
    const decisionEvent: DecisionEvent = {
      requestId,
      filePath,
      decision,
      timestamp: new Date(),
      userId
    }
    
    this.decisionHistory.push(decisionEvent)
    securityAudit.logAccessAttempt(`trust_decision_${decision}`, filePath, userId)
    
    // Update overall request status
    this.updateRequestStatus(requestId)
    
    return { 
      success: true, 
      message: `Decision '${decision}' recorded for ${filePath}` 
    }
  }
  
  /**
   * Accept all changes in a request
   */
  async acceptAll(requestId: string, userId: string): Promise<{ 
    success: boolean; 
    message: string; 
    errors: string[] 
  }> {
    const request = this.requests.get(requestId)
    if (!request) {
      return { success: false, message: 'Change request not found', errors: [] }
    }
    
    if (request.userId !== userId) {
      return { success: false, message: 'Unauthorized', errors: [] }
    }
    
    securityAudit.logAccessAttempt('trust_accept_all', requestId, userId)
    
    // Apply all changes to disk
    const result = await request.vfs.applyChanges()
    
    if (result.success) {
      // Record decisions for all files
      const modifiedFiles = request.vfs.getModifiedFiles()
      modifiedFiles.forEach(file => {
        this.makeDecision(requestId, file.path, 'accept', userId)
      })
      
      return {
        success: true,
        message: `Successfully applied ${modifiedFiles.length} changes`,
        errors: []
      }
    } else {
      return {
        success: false,
        message: 'Failed to apply changes',
        errors: result.errors
      }
    }
  }
  
  /**
   * Reject all changes in a request
   */
  rejectAll(requestId: string, userId: string): { 
    success: boolean; 
    message: string 
  } {
    const request = this.requests.get(requestId)
    if (!request) {
      return { success: false, message: 'Change request not found' }
    }
    
    if (request.userId !== userId) {
      return { success: false, message: 'Unauthorized' }
    }
    
    securityAudit.logAccessAttempt('trust_reject_all', requestId, userId)
    
    // Discard all changes
    request.vfs.discardChanges()
    
    // Record decisions for all files
    const modifiedFiles = request.vfs.getModifiedFiles()
    modifiedFiles.forEach(file => {
      this.makeDecision(requestId, file.path, 'reject', userId)
    })
    
    return {
      success: true,
      message: `Successfully discarded ${modifiedFiles.length} changes`
    }
  }
  
  /**
   * Get preview content for a file
   */
  getFilePreview(requestId: string, filePath: string, userId: string): {
    success: boolean;
    preview?: PreviewContent;
    message?: string;
  } {
    const request = this.requests.get(requestId)
    if (!request) {
      return { success: false, message: 'Change request not found' }
    }
    
    if (request.userId !== userId) {
      return { success: false, message: 'Unauthorized' }
    }
    
    try {
      const preview = request.previewGenerator.generateFilePreview(filePath)
      return { success: true, preview }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to generate preview' 
      }
    }
  }
  
  /**
   * Get summary preview for all changes
   */
  getSummaryPreview(requestId: string, userId: string): {
    success: boolean;
    preview?: PreviewContent;
    message?: string;
  } {
    const request = this.requests.get(requestId)
    if (!request) {
      return { success: false, message: 'Change request not found' }
    }
    
    if (request.userId !== userId) {
      return { success: false, message: 'Unauthorized' }
    }
    
    try {
      const preview = request.previewGenerator.generateSummaryPreview()
      return { success: true, preview }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to generate summary' 
      }
    }
  }
  
  /**
   * Get quick diff overview
   */
  getQuickOverview(requestId: string, userId: string): {
    success: boolean;
    diffs?: string[];
    stats?: any;
    message?: string;
  } {
    const request = this.requests.get(requestId)
    if (!request) {
      return { success: false, message: 'Change request not found' }
    }
    
    if (request.userId !== userId) {
      return { success: false, message: 'Unauthorized' }
    }
    
    try {
      const diffs = request.previewGenerator.getAllQuickDiffs()
      const stats = request.vfs.getStats()
      return { success: true, diffs, stats }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to generate overview' 
      }
    }
  }
  
  /**
   * Update request status based on individual decisions
   */
  private updateRequestStatus(requestId: string): void {
    const request = this.requests.get(requestId)
    if (!request) return
    
    const modifiedFiles = request.vfs.getModifiedFiles()
    const decisions = Array.from(request.decisions.values())
    
    if (decisions.length === 0) {
      request.status = 'pending'
    } else if (decisions.every(d => d === 'accept')) {
      request.status = 'accept'
    } else if (decisions.every(d => d === 'reject')) {
      request.status = 'reject'
    } else {
      request.status = 'partial'
    }
    
    request.updatedAt = new Date()
  }
  
  /**
   * Get decision history
   */
  getDecisionHistory(userId: string, limit: number = 50): DecisionEvent[] {
    return this.decisionHistory
      .filter(event => event.userId === userId)
      .slice(-limit)
      .reverse()
  }
  
  /**
   * Get system statistics
   */
  getStats(): {
    totalRequests: number
    pendingRequests: number
    acceptedRequests: number
    rejectedRequests: number
    totalDecisions: number
  } {
    const allRequests = Array.from(this.requests.values())
    
    return {
      totalRequests: allRequests.length,
      pendingRequests: allRequests.filter(r => r.status === 'pending').length,
      acceptedRequests: allRequests.filter(r => r.status === 'accept').length,
      rejectedRequests: allRequests.filter(r => r.status === 'reject').length,
      totalDecisions: this.decisionHistory.length
    }
  }
  
  /**
   * Clean up old requests (older than 24 hours)
   */
  cleanupOldRequests(): number {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    let cleaned = 0
    
    for (const [requestId, request] of this.requests) {
      if (request.createdAt < cutoff) {
        this.requests.delete(requestId)
        cleaned++
      }
    }
    
    return cleaned
  }
}

// Export for use in other modules