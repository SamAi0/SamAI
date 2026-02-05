import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { VirtualFilesystemLayer } from '@/lib/ai/virtual-filesystem'
import { TrustSystem } from '@/lib/ai/trust-system'
import { securityAudit } from '@/lib/security/audit-logger'

// Global trust system instance (in production, use proper state management)
const trustSystem = new TrustSystem()

/**
 * Trust System API - Phase 2
 * 
 * Manages change requests, previews, and accept/reject decisions.
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    const { requestId } = await context.params
    
    // Get change request
    const changeRequest = trustSystem.getChangeRequest(requestId)
    if (!changeRequest) {
      return NextResponse.json({ error: 'Change request not found' }, { status: 404 })
    }
    
    if (changeRequest.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Get summary and quick overview
    const summaryResult = trustSystem.getSummaryPreview(requestId, userId)
    const overviewResult = trustSystem.getQuickOverview(requestId, userId)
    
    if (!summaryResult.success || !overviewResult.success) {
      return NextResponse.json({ 
        error: 'Failed to generate preview' 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      requestId,
      summary: summaryResult.preview,
      overview: overviewResult,
      status: changeRequest.status,
      createdAt: changeRequest.createdAt,
      updatedAt: changeRequest.updatedAt
    })
    
  } catch (error) {
    console.error('Trust system GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch change request' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    const { requestId } = await context.params
    const body = await request.json()
    const { action, filePath } = body
    
    securityAudit.logAccessAttempt(`trust_api_${action}`, requestId, userId)
    
    switch (action) {
      case 'accept_all':
        const acceptResult = await trustSystem.acceptAll(requestId, userId)
        return NextResponse.json(acceptResult)
        
      case 'reject_all':
        const rejectResult = trustSystem.rejectAll(requestId, userId)
        return NextResponse.json(rejectResult)
        
      case 'decide':
        if (!filePath) {
          return NextResponse.json({ error: 'File path required' }, { status: 400 })
        }
        const decisionResult = trustSystem.makeDecision(requestId, filePath, body.decision, userId)
        return NextResponse.json(decisionResult)
        
      case 'get_preview':
        if (!filePath) {
          return NextResponse.json({ error: 'File path required' }, { status: 400 })
        }
        const previewResult = trustSystem.getFilePreview(requestId, filePath, userId)
        return NextResponse.json(previewResult)
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Trust system POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process trust action' },
      { status: 500 }
    )
  }
}