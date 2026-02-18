/**
 * Token limiter utility for preventing token explosion in LLM requests
 *
 * Context in LLMs includes:
 * - System prompt
 * - Chat history
 * - User message
 * - Code/files attached
 * - Previous responses
 *
 * Token estimation: 1 token ≈ 3-4 characters of English text
 */

export class TokenLimiter {
  private static readonly DEFAULT_MAX_TOKENS = 4000
  private static readonly CHARS_PER_TOKEN = 4 // Conservative estimate

  /**
   * Estimate token count from text content
   * @param text The text to estimate tokens for
   * @returns Estimated token count
   */
  static estimateTokens(text: string): number {
    if (!text) return 0
    return Math.ceil(text.length / this.CHARS_PER_TOKEN)
  }

  /**
   * Truncate text to fit within token limit
   * @param text Text to truncate
   * @param maxTokens Maximum allowed tokens
   * @param bufferTokens Buffer for system prompts/responses
   * @returns Truncated text with warning suffix
   */
  static truncateToTokens(
    text: string,
    maxTokens: number = this.DEFAULT_MAX_TOKENS,
    bufferTokens: number = 200, // Reserve tokens for system prompt
  ): { content: string; truncated: boolean; originalTokens: number; finalTokens: number } {
    const maxChars = (maxTokens - bufferTokens) * this.CHARS_PER_TOKEN
    const originalTokens = this.estimateTokens(text)

    if (text.length <= maxChars) {
      return {
        content: text,
        truncated: false,
        originalTokens,
        finalTokens: originalTokens,
      }
    }

    // Truncate and add warning
    const truncatedContent = text.substring(0, maxChars) + '... [content truncated to prevent token overflow]'
    const finalTokens = this.estimateTokens(truncatedContent)

    return {
      content: truncatedContent,
      truncated: true,
      originalTokens,
      finalTokens,
    }
  }

  /**
   * Check if content exceeds token limits
   * @param content Text content to check
   * @param maxTokens Maximum allowed tokens
   * @param bufferTokens Buffer for system overhead
   * @returns Object with validation results
   */
  static validateTokenLimit(
    content: string,
    maxTokens: number = this.DEFAULT_MAX_TOKENS,
    bufferTokens: number = 200,
  ): {
    valid: boolean
    estimatedTokens: number
    maxTokens: number
    message?: string
  } {
    const estimatedTokens = this.estimateTokens(content) + bufferTokens

    if (estimatedTokens <= maxTokens) {
      return {
        valid: true,
        estimatedTokens,
        maxTokens,
      }
    }

    return {
      valid: false,
      estimatedTokens,
      maxTokens,
      message: `Content exceeds token limit - estimated ${estimatedTokens} tokens, maximum is ${maxTokens} tokens. Please shorten your request.`,
    }
  }

  /**
   * Get safe context limits for different model types
   * @param model Model name
   * @returns Recommended token limits
   */
  static getModelLimits(model: string): { maxContextTokens: number; maxMessageTokens: number } {
    const modelLower = model.toLowerCase()

    // Different limits based on model capabilities
    if (modelLower.includes('llama3') || modelLower.includes('codellama')) {
      return {
        maxContextTokens: 8000, // Larger context for code models
        maxMessageTokens: 6000, // Conservative message limit
      }
    } else if (modelLower.includes('mistral') || modelLower.includes('mixtral')) {
      return {
        maxContextTokens: 32000, // Very large context
        maxMessageTokens: 8000, // Still conservative for safety
      }
    } else if (modelLower.includes('deepseek')) {
      return {
        maxContextTokens: 16000,
        maxMessageTokens: 8000,
      }
    } else if (modelLower.includes('gemma')) {
      return {
        maxContextTokens: 8000,
        maxMessageTokens: 4000,
      }
    } else {
      // Default conservative limits
      return {
        maxContextTokens: 4000,
        maxMessageTokens: 3000,
      }
    }
  }
}

// Export constants for easy access
export const TOKEN_LIMITS = {
  DEFAULT_MAX_CONTEXT: 4000,
  DEFAULT_MAX_MESSAGE: 3000,
  CHARS_PER_TOKEN: 4,
  SYSTEM_PROMPT_BUFFER: 200,
} as const
