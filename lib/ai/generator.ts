import { OpenAI } from 'openai'

export interface AIRequest {
  taskId: string
  prompt: string
  systemPrompt?: string
  model?: string
  context?: string
}

export interface AIResponse {
  content: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIGenerator {
  generate(request: AIRequest): Promise<AIResponse>
  stream(request: AIRequest, onChunk: (chunk: string) => void): Promise<void>
}

export class LocalLLMGenerator implements AIGenerator {
  private baseUrl: string
  private defaultModel: string

  constructor(baseUrl: string = 'http://localhost:11434', defaultModel: string = 'deepseek-coder:6.7b-instruct-q4_K_M') {
    this.baseUrl = baseUrl
    this.defaultModel = defaultModel
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const model = request.model || this.defaultModel
    const messages = [
      ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
      { role: 'user', content: request.context ? `Context:\n${request.context}\n\nProblem:\n${request.prompt}` : request.prompt }
    ]

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            num_ctx: 16384 // Increased context window for DeepSeek
          }
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Local LLM error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      return {
        content: data.message?.content || '',
        model: data.model,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        }
      }
    } catch (error) {
      console.error('Local LLM generation failed:', error)
      throw error
    }
  }

  async stream(request: AIRequest, onChunk: (chunk: string) => void): Promise<void> {
    const model = request.model || this.defaultModel
    const messages = [
      ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
      { role: 'user', content: request.context ? `Context:\n${request.context}\n\nProblem:\n${request.prompt}` : request.prompt }
    ]

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          options: {
            temperature: 0.7,
            num_ctx: 16384
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Local LLM stream error: ${response.status}`)
      }

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        const lines = buffer.split('\n')
        // Keep the last line in the buffer as it might be incomplete
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const data = JSON.parse(line)
            if (data.message?.content) {
              onChunk(data.message.content)
            }
            if (data.done) {
              return
            }
          } catch (e) {
            console.warn('Error parsing stream line:', e)
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer)
          if (data.message?.content) {
            onChunk(data.message.content)
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (error) {
      console.error('Local LLM streaming failed:', error)
      throw error
    }
  }
}

// Factory function
export function getAIGenerator(): AIGenerator {
  const provider = process.env.AI_PROVIDER || 'local'

  if (provider === 'local') {
    const baseUrl = process.env.LOCAL_LLM_BASE_URL || 'http://localhost:11434'
    const model = process.env.LOCAL_LLM_MODEL || 'deepseek-coder:6.7b-instruct-q4_K_M'
    return new LocalLLMGenerator(baseUrl, model)
  }

  // Fallback or OpenAI implementation
  throw new Error(`Provider ${provider} not implemented yet`)
}
