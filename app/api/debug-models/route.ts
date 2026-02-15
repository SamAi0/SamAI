import { NextRequest } from 'next/server'

export async function GET() {
  try {
    // Get available models from Ollama
    const response = await fetch('http://localhost:11434/api/tags')
    
    if (response.ok) {
      const data = await response.json()
      const availableModels = data.models?.map((m: any) => m.name) || []
      
      return new Response(JSON.stringify({
        success: true,
        availableModels,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: `Ollama API error: ${response.status}`
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch Ollama models',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}