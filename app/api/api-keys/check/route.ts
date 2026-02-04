import { NextRequest, NextResponse } from 'next/server'
import { getUserApiKey } from '@/lib/api-keys/user-keys'

type Provider = 'openai' | 'gemini' | 'cursor' | 'anthropic'

// Map agents to their required providers
const AGENT_PROVIDER_MAP: Record<string, Provider | null> = {
  ollama: null, // No API key required for local Ollama
}

// Check if a model is an Anthropic model
function isAnthropicModel(model: string): boolean {
  const anthropicPatterns = ['claude', 'sonnet', 'opus']
  const lowerModel = model.toLowerCase()
  return anthropicPatterns.some((pattern) => lowerModel.includes(pattern))
}

// Check if a model is an OpenAI model
function isOpenAIModel(model: string): boolean {
  const openaiPatterns = ['gpt', 'openai']
  const lowerModel = model.toLowerCase()
  return openaiPatterns.some((pattern) => lowerModel.includes(pattern))
}

// Check if a model is a Gemini model
function isGeminiModel(model: string): boolean {
  const geminiPatterns = ['gemini']
  const lowerModel = model.toLowerCase()
  return geminiPatterns.some((pattern) => lowerModel.includes(pattern))
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const agent = searchParams.get('agent')
    const model = searchParams.get('model')

    if (!agent) {
      return NextResponse.json({ error: 'Agent parameter is required' }, { status: 400 })
    }

    let provider = AGENT_PROVIDER_MAP[agent]
    if (provider === undefined) {
      return NextResponse.json({ error: 'Invalid agent' }, { status: 400 })
    }

    // Ollama runs locally, no API key needed
    if (agent === 'ollama') {
      return NextResponse.json({
        success: true,
        hasKey: true,
        provider: 'ollama',
        agentName: 'Ollama',
      })
    }

    // Check if API key is available (either user's or system)
    const apiKey = await getUserApiKey(provider!)
    const hasKey = !!apiKey

    return NextResponse.json({
      success: true,
      hasKey,
      provider,
      agentName: agent.charAt(0).toUpperCase() + agent.slice(1),
    })
  } catch (error) {
    console.error('Error checking API key:', error)
    return NextResponse.json({ error: 'Failed to check API key' }, { status: 500 })
  }
}
