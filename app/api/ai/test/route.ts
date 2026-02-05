import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/ai/ai-service'
import { getServerSession } from '@/lib/session/get-server-session'
import { getWorkspaceRoot } from '@/lib/security/file-access-control.node'

/**
 * Action-Based AI API - Phase 1 Testing Endpoint
 * 
 * Test the AI service with action schema validation and execution.
 */

// Test AI responses for demonstration
const TEST_RESPONSES = {
  valid: `{
    "thought": "I need to create a new component file for the dashboard",
    "actions": [
      {
        "type": "create_file",
        "path": "components/dashboard/new-component.tsx",
        "content": "import React from 'react';\\n\\nexport function NewComponent() {\\n  return <div>Hello World</div>;\\n}"
      }
    ]
  }`,
  
  invalidFormat: `{
    "thought": "This is missing the actions array",
    "something_else": "invalid structure"
  }`,
  
  invalidJSON: `{
    "thought": "This has invalid JSON syntax",
    "actions": [
      {
        "type": "create_file",
        "path": "test.txt",
        "content": "missing closing quote
      }
    ]
  }`,
  
  plainText: "This is just plain text, not JSON",
  
  markdownJSON: "```json\n{\n  \"thought\": \"Testing markdown wrapped JSON\",\n  \"actions\": [\n    {\n      \"type\": \"read_file\",\n      \"path\": \"README.md\"\n    }\n  ]\n}\n```"
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = session.user.id
    const taskId = `test-${Date.now()}`
    const workspaceRoot = getWorkspaceRoot()
    
    const body = await request.json()
    const { testType = 'valid', customResponse } = body
    
    // Get the response to test
    const aiResponse = customResponse || TEST_RESPONSES[testType as keyof typeof TEST_RESPONSES]
    
    if (!aiResponse) {
      return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    }
    
    // Create AI service instance
    const aiService = new AIService({
      maxRetries: 2,
      retryDelay: 500,
      requireJSON: true
    })
    
    // Process the AI response
    const result = await aiService.processAIResponse(
      aiResponse,
      taskId,
      userId,
      workspaceRoot
    )
    
    // Get service statistics
    const stats = aiService.getInvalidResponseStats()
    const recentInvalid = aiService.getInvalidResponses(5)
    
    return NextResponse.json({
      success: true,
      testType,
      taskId,
      userId,
      workspaceRoot,
      result: {
        success: result.success,
        retryCount: result.retryCount,
        errorCount: result.errors?.length || 0,
        errors: result.errors,
        executionResults: result.executionResults,
        hasSchema: !!result.schema
      },
      serviceStats: stats,
      recentInvalidResponses: recentInvalid.map(log => ({
        timestamp: log.timestamp,
        errorCount: log.errors.length,
        retryCount: log.retryCount,
        firstError: log.errors[0]?.message
      })),
      rawResponse: result.rawResponse
    })
    
  } catch (error) {
    console.error('AI service test error:', error)
    return NextResponse.json(
      { error: 'Failed to test AI service' },
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
    
    // Return available test types
    return NextResponse.json({
      success: true,
      availableTests: Object.keys(TEST_RESPONSES),
      description: "Action-Based AI System - Phase 1 Test Endpoint",
      instructions: {
        "POST /api/ai/test": "Test AI response processing",
        "Body parameters": {
          "testType": "One of: valid, invalidFormat, invalidJSON, plainText, markdownJSON",
          "customResponse": "Optional custom AI response to test"
        }
      }
    })
    
  } catch (error) {
    console.error('AI service info error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI service info' },
      { status: 500 }
    )
  }
}