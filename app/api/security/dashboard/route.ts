import { NextRequest, NextResponse } from 'next/server'
import { securityAudit } from '@/lib/security/audit-logger'
import { getWorkspaceRoot, isPathInWorkspace } from '@/lib/security/file-access-control.node'
import { getServerSession } from '@/lib/session/get-server-session'

export const runtime = 'nodejs'

/**
 * Security Dashboard API - File Access Control System 0.1
 * 
 * Provides security monitoring and statistics.
 * Only accessible to authenticated users.
 */

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get security statistics
    const stats = securityAudit.getStats()
    const recentEvents = securityAudit.getRecentEvents(20)
    const violations = securityAudit.getViolations()
    
    // Get workspace information
    const workspaceRoot = getWorkspaceRoot()
    const workspaceCheck = {
      root: workspaceRoot,
      cwd: process.cwd(),
      isConsistent: workspaceRoot === process.cwd()
    }
    
    // Test path validation
    const pathTests = [
      { path: './test.txt', valid: isPathInWorkspace('./test.txt') },
      { path: '../outside.txt', valid: isPathInWorkspace('../outside.txt') },
      { path: '/etc/passwd', valid: isPathInWorkspace('/etc/passwd') },
      { path: process.cwd(), valid: isPathInWorkspace(process.cwd()) }
    ]
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      workspace: workspaceCheck,
      securityStats: {
        ...stats,
        violationRate: stats.totalEvents > 0 ? (stats.violations / stats.totalEvents * 100).toFixed(2) + '%' : '0%'
      },
      pathValidationTests: pathTests,
      recentEvents: recentEvents.map(event => ({
        timestamp: event.timestamp,
        eventType: event.eventType,
        severity: event.severity,
        operation: event.operation,
        path: event.path
      })),
      violations: violations.map(violation => ({
        timestamp: violation.timestamp,
        operation: violation.operation,
        path: violation.path,
        details: violation.details
      }))
    })
    
  } catch (error) {
    console.error('Security dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const action = body.action
    
    switch (action) {
      case 'clear_events':
        securityAudit.clearEvents()
        return NextResponse.json({ success: true, message: 'Security events cleared' })
        
      case 'test_path':
        const testPath = body.path
        if (!testPath) {
          return NextResponse.json({ error: 'Path required' }, { status: 400 })
        }
        const isValid = isPathInWorkspace(testPath)
        return NextResponse.json({ 
          path: testPath,
          isValid,
          workspaceRoot: getWorkspaceRoot()
        })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Security dashboard action error:', error)
    return NextResponse.json(
      { error: 'Failed to perform security action' },
      { status: 500 }
    )
  }
}