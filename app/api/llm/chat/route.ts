import { NextRequest } from 'next/server'
import { TokenLimiter, TOKEN_LIMITS } from '@/lib/utils/token-limiter'

export async function POST(request: NextRequest) {
  try {
    const { message, model = 'codellama' } = await request.json()

    // Validate inputs
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Optionally validate model against Ollama's available models
    // We'll fetch available models from Ollama to validate
    try {
      const modelsResponse = await fetch('http://localhost:11434/api/tags')
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json()
        const availableModels = modelsData.models?.map((m: any) => m.name) || []

        // Check if the requested model exists in Ollama
        const modelExists = availableModels.some(
          (availableModel: string) =>
            availableModel.toLowerCase().includes(model.toLowerCase()) ||
            model.toLowerCase().includes(availableModel.toLowerCase()),
        )

        if (!modelExists) {
          console.warn(`Requested model '${model}' not found in Ollama. Available models:`, availableModels)
          // Don't block the request as user might be pulling a new model
          // Just log the warning and proceed
        }
      }
    } catch (error) {
      console.warn('Could not validate model against Ollama - proceeding anyway', error)
      // Continue without validation if Ollama is not accessible
    }

    // Hard context limits using token limiter utility
    const modelLimits = TokenLimiter.getModelLimits(model)
    const {
      content: truncatedMessage,
      truncated,
      originalTokens,
      finalTokens,
    } = TokenLimiter.truncateToTokens(message, modelLimits.maxMessageTokens, TOKEN_LIMITS.SYSTEM_PROMPT_BUFFER)

    if (truncated) {
      console.warn(`Message truncated from ${originalTokens} to ${finalTokens} tokens to prevent token explosion`)
    }

    // Validate token limits
    const validation = TokenLimiter.validateTokenLimit(
      truncatedMessage,
      modelLimits.maxContextTokens,
      TOKEN_LIMITS.SYSTEM_PROMPT_BUFFER,
    )

    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: validation.message,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Connect to local Ollama instance
    const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: truncatedMessage,
          },
        ],
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_ctx: modelLimits.maxContextTokens, // Hard limit on context size
        },
      }),
    })

    if (!ollamaResponse.ok) {
      const errorData = await ollamaResponse.text()
      console.error('Ollama API error:', ollamaResponse.status, errorData)
      return new Response(
        JSON.stringify({
          error: `Ollama API error: ${ollamaResponse.status} - ${errorData}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Create a transform stream to handle server-sent events
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaResponse.body?.getReader()

        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              break
            }

            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true })

            // Split by newlines since Ollama returns JSONL (JSON Lines)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const jsonData = JSON.parse(line)

                  // If it's a message with content, send it to the client
                  if (jsonData.message?.content) {
                    const data = {
                      type: 'response',
                      content: jsonData.message.content,
                    }

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
                  }

                  // If it's a done signal, send completion message
                  if (jsonData.done) {
                    const doneData = {
                      type: 'done',
                      content: '',
                    }

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneData)}\n\n`))
                  }
                } catch (e) {
                  // Skip lines that aren't valid JSON
                  continue
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        } finally {
          reader.releaseLock()
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in Ollama chat API:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Health check endpoint
export async function GET() {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Cannot connect to Ollama', connected: false }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    return new Response(
      JSON.stringify({
        connected: true,
        models: data.models?.map((m: any) => m.name) || [],
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error checking Ollama connection:', error)
    return new Response(JSON.stringify({ error: 'Cannot connect to Ollama', connected: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
