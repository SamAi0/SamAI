import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { VirtualFilesystemLayer } from '@/lib/ai/virtual-filesystem'
import { FileEditingIntelligence } from '@/lib/ai/file-editing-intelligence'
import { AIResponseProcessor } from '@/lib/ai/ai-response-processor'
import { getWorkspaceRoot } from '@/lib/security/file-access-control.node'

export const runtime = 'nodejs'

/**
 * File Editing Intelligence API - Phase 4 Testing
 * 
 * Tests intelligent patch-based updates with failure handling.
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    const taskId = `editing-${Date.now()}`
    const workspaceRoot = getWorkspaceRoot()
    
    const body = await request.json()
    const { filePath, content, operation = 'update', strategy = 'auto' } = body
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }
    
    // Create virtual filesystem
    const vfs = new VirtualFilesystemLayer(taskId, userId, workspaceRoot)
    
    // Load the file if it exists
    try {
      await vfs.loadFile(filePath)
    } catch (error) {
      // File doesn't exist, that's ok
    }
    
    // Create file editing intelligence
    const fileEditingIntelligence = new FileEditingIntelligence(vfs, {
      preferPatches: strategy !== 'rewrite',
      maxRetries: 3
    })
    
    let result: any = {}
    
    switch (operation) {
      case 'update':
        if (!content) {
          return NextResponse.json({ error: 'Content is required for update operation' }, { status: 400 })
        }
        
        // Analyze the optimal strategy
        const analysis = fileEditingIntelligence.analyzeEditStrategy(filePath, content)
        result.analysis = analysis
        
        // Apply the update with minimal changes
        const updateResult = await fileEditingIntelligence.updateFileWithMinimalChanges(filePath, content)
        result.updateResult = updateResult
        break
        
      case 'analyze':
        if (!content) {
          return NextResponse.json({ error: 'Content is required for analysis operation' }, { status: 400 })
        }
        
        // Just analyze the optimal strategy
        const analysisResult = fileEditingIntelligence.analyzeEditStrategy(filePath, content)
        result.analysis = analysisResult
        break
        
      case 'ai_process':
        if (!content) {
          return NextResponse.json({ error: 'AI response content is required for AI processing' }, { status: 400 })
        }
        
        // Process AI response
        const processor = new AIResponseProcessor(vfs)
        const processedResponse = processor.processAIResponse(filePath, content)
        result.processedResponse = processedResponse
        
        // Apply the changes
        if (processedResponse.type !== 'invalid') {
          const applyResult = await processor.applyAIChanges(filePath, processedResponse)
          result.applyResult = applyResult
        }
        break
        
      default:
        return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 })
    }
    
    // Get the current file state
    const fileState = vfs.getFile(filePath)
    result.fileState = {
      path: fileState?.path,
      exists: fileState?.exists,
      isModified: fileState?.isModified,
      contentLength: fileState?.content.length,
      originalExists: fileState?.originalExists
    }
    
    // Get stats
    result.stats = vfs.getStats()
    
    return NextResponse.json({
      success: true,
      taskId,
      userId,
      workspaceRoot,
      filePath,
      operation,
      result
    })
    
  } catch (error) {
    console.error('File editing intelligence error:', error)
    return NextResponse.json(
      { error: 'Failed to process file editing request' },
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
    
    return NextResponse.json({
      success: true,
      description: "File Editing Intelligence API - Phase 4",
      endpoints: {
        "POST /api/ai/editing": "Process file editing operations",
        "Supported operations": ["update", "analyze", "ai_process"],
        "Parameters": {
          "filePath": "Path to the file",
          "content": "File content for update/analysis",
          "operation": "One of: update, analyze, ai_process",
          "strategy": "One of: auto, patch, rewrite"
        }
      }
    })
    
  } catch (error) {
    console.error('File editing info error:', error)
    return NextResponse.json(
      { error: 'Failed to get file editing info' },
      { status: 500 }
    )
  }
}