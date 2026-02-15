import { NextRequest } from 'next/server'

export async function GET() {
  try {
    // Test DeepSeek model specifically
    const testMessage = "Create a simple HTML todo list"
    
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-coder:6.7b-instruct-q4_K_M',
        messages: [
          {
            role: 'user',
            content: testMessage,
          },
        ],
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return new Response(JSON.stringify({
        success: true,
        model: 'deepseek-coder:6.7b-instruct-q4_K_M',
        response: data.message?.content || 'No response content',
        testMessage: testMessage
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      const errorText = await response.text()
      return new Response(JSON.stringify({
        success: false,
        error: `DeepSeek API error: ${response.status}`,
        details: errorText
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to test DeepSeek integration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}