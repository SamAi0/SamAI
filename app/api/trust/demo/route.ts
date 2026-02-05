import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { VirtualFilesystemLayer } from '@/lib/ai/virtual-filesystem'
import { TrustSystem } from '@/lib/ai/trust-system'
import { getWorkspaceRoot } from '@/lib/security/file-access-control.node'

export const runtime = 'nodejs'

// Global instances for testing
const trustSystem = new TrustSystem()

/**
 * Trust System Demo API - Phase 2 Testing
 * 
 * Demonstrates the complete workflow of the trust system.
 */

// Demo operations for testing
const DEMO_OPERATIONS = {
  createFile: {
    thought: "Creating a new utility component",
    actions: [
      {
        type: "create_file",
        path: "components/demo/new-component.tsx",
        content: "import React from 'react';\n\nexport function NewComponent() {\n  return <div>Demo Component</div>;\n}"
      }
    ]
  },
  
  updateFile: {
    thought: "Updating existing utility function",
    actions: [
      {
        type: "update_file",
        path: "lib/utils.ts",
        content: "export function demoFunction() {\n  return 'Updated demo function';\n}\n\nexport function newUtility() {\n  return 'New utility function';\n}"
      }
    ]
  },
  
  deleteFile: {
    thought: "Removing deprecated file",
    actions: [
      {
        type: "delete_file",
        path: "deprecated/old-file.ts"
      }
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    const taskId = `demo-${Date.now()}`
    const workspaceRoot = getWorkspaceRoot()
    
    const body = await request.json()
    const { operation = 'createFile', customActions } = body
    
    // Get demo actions or use custom
    const actions = customActions || DEMO_OPERATIONS[operation as keyof typeof DEMO_OPERATIONS]
    
    if (!actions) {
      return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 })
    }
    
    // Create virtual filesystem and load initial state
    const vfs = new VirtualFilesystemLayer(taskId, userId, workspaceRoot)
    
    // Simulate AI actions in virtual filesystem
    for (const action of actions.actions) {
      switch (action.type) {
        case 'create_file':
          vfs.createFile(action.path, action.content || '')
          break
        case 'update_file':
          // First load the file, then update it
          await vfs.loadFile(action.path)
          vfs.updateFile(action.path, action.content || '')
          break
        case 'delete_file':
          await vfs.loadFile(action.path)
          vfs.deleteFile(action.path)
          break
        case 'read_file':
          await vfs.loadFile(action.path)
          break
      }
    }
    
    // Create change request in trust system
    const changeRequest = trustSystem.createChangeRequest(taskId, userId, vfs)
    
    // Get previews and summary
    const summaryResult = trustSystem.getSummaryPreview(changeRequest.id, userId)
    const overviewResult = trustSystem.getQuickOverview(changeRequest.id, userId)
    
    return NextResponse.json({
      success: true,
      demoType: operation,
      requestId: changeRequest.id,
      taskId,
      userId,
      workspaceRoot,
      summary: summaryResult.success ? summaryResult.preview : null,
      overview: overviewResult.success ? overviewResult : null,
      stats: vfs.getStats(),
      modifiedFiles: vfs.getModifiedFiles().map(f => ({
        path: f.path,
        exists: f.exists,
        isModified: f.isModified,
        originalExists: f.originalExists
      }))
    })
    
  } catch (error) {
    console.error('Trust system demo error:', error)
    return NextResponse.json(
      { error: 'Failed to run trust system demo' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    
    // Get system statistics
    const stats = trustSystem.getStats()
    const userRequests = trustSystem.getUserRequests(userId)
    const recentDecisions = trustSystem.getDecisionHistory(userId, 10)
    
    return NextResponse.json({
      success: true,
      availableDemos: Object.keys(DEMO_OPERATIONS),
      systemStats: stats,
      userRequests: userRequests.length,
      recentDecisions: recentDecisions.map(decision => ({
        requestId: decision.requestId,
        filePath: decision.filePath,
        decision: decision.decision,
        timestamp: decision.timestamp
      })),
      instructions: {
        "POST /api/trust/demo": "Run trust system demo",
        "Body parameters": {
          "operation": "One of: createFile, updateFile, deleteFile",
          "customActions": "Optional custom actions array"
        }
      }
    })
    
  } catch (error) {
    console.error('Trust system info error:', error)
    return NextResponse.json(
      { error: 'Failed to get trust system info' },
      { status: 500 }
    )
  }
}