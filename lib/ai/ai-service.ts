/**
 * AI Service - Phase 1
 * 
 * Handles AI response validation, parsing, and execution.
 * Implements retry logic for failed responses.
 */

import { ActionSchema, parseAndValidateAIResponse, ValidationError } from './action-schema'
import { IntentExecutionEngine } from './intent-execution-engine'
import { securityAudit } from '@/lib/security/audit-logger'

// AI Service Configuration
interface AIServiceConfig {
  maxRetries: number
  retryDelay: number // milliseconds
  requireJSON: boolean
}

// AI Response Result
interface AIResponseResult {
  success: boolean
  schema?: ActionSchema
  errors?: ValidationError[]
  executionResults?: any[]
  retryCount: number
  rawResponse: string
}

// Invalid Response Log Entry
interface InvalidResponseLog {
  timestamp: Date
  taskId: string
  userId: string
  rawResponse: string
  errors: ValidationError[]
  retryCount: number
}

/**
 * AI Service Class
 */
export class AIService {
  private config: AIServiceConfig
  private invalidResponses: InvalidResponseLog[] = []
  
  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      requireJSON: config.requireJSON ?? true
    }
  }
  
  /**
   * Process AI response with validation and execution
   */
  async processAIResponse(
    response: string,
    taskId: string,
    userId: string,
    workspaceRoot: string
  ): Promise<AIResponseResult> {
    securityAudit.logAccessAttempt('ai_response_process', taskId, userId)
    
    let retryCount = 0
    let lastResult: AIResponseResult | null = null
    
    while (retryCount <= this.config.maxRetries) {
      try {
        // Parse and validate the response
        const validationResult = parseAndValidateAIResponse(response)
        
        if (validationResult.success && validationResult.data) {
          // Validation successful - execute the actions
          const executionEngine = new IntentExecutionEngine(taskId, userId, workspaceRoot)
          const executionResults = await executionEngine.executeSchema(validationResult.data)
          
          securityAudit.logPathValidated('ai_schema_execution', taskId, workspaceRoot)
          
          return {
            success: true,
            schema: validationResult.data,
            executionResults,
            retryCount,
            rawResponse: validationResult.rawResponse
          }
        } else {
          // Validation failed - log invalid response
          this.logInvalidResponse(taskId, userId, response, validationResult.errors || [], retryCount)
          
          if (retryCount >= this.config.maxRetries) {
            // Max retries reached
            return {
              success: false,
              errors: validationResult.errors,
              retryCount,
              rawResponse: response
            }
          }
          
          // Prepare for retry
          lastResult = {
            success: false,
            errors: validationResult.errors,
            retryCount,
            rawResponse: response
          }
          
          retryCount++
          
          // Wait before retry
          if (this.config.retryDelay > 0) {
            await this.delay(this.config.retryDelay)
          }
          
          // In a real implementation, this would trigger a retry with the AI
          // For now, we'll simulate by modifying the response
          response = this.simulateRetryResponse(response, retryCount)
        }
        
      } catch (error) {
        securityAudit.logViolationBlocked('ai_response_processing', taskId, { 
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount
        })
        
        if (retryCount >= this.config.maxRetries) {
          return {
            success: false,
            errors: [{
              field: 'processing',
              message: `Failed to process AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
              value: response
            }],
            retryCount,
            rawResponse: response
          }
        }
        
        retryCount++
        await this.delay(this.config.retryDelay)
        response = this.simulateRetryResponse(response, retryCount)
      }
    }
    
    // Should never reach here, but TypeScript needs it
    return lastResult || {
      success: false,
      errors: [{ field: 'unknown', message: 'Processing failed', value: null }],
      retryCount: 0,
      rawResponse: ''
    }
  }
  
  /**
   * Log invalid AI responses for debugging
   */
  private logInvalidResponse(
    taskId: string,
    userId: string,
    response: string,
    errors: ValidationError[],
    retryCount: number
  ): void {
    const logEntry: InvalidResponseLog = {
      timestamp: new Date(),
      taskId,
      userId,
      rawResponse: response,
      errors,
      retryCount
    }
    
    this.invalidResponses.push(logEntry)
    
    // Keep only recent invalid responses (last 100)
    if (this.invalidResponses.length > 100) {
      this.invalidResponses = this.invalidResponses.slice(-100)
    }
    
    // Log to security audit
    securityAudit.logViolationBlocked(
      'invalid_ai_response',
      taskId,
      {
        userId,
        errorCount: errors.length,
        errors: errors.map(e => ({ field: e.field, message: e.message })),
        retryCount
      }
    )
    
    console.warn(`Invalid AI response logged:`, {
      taskId,
      errorCount: errors.length,
      retryCount,
      firstError: errors[0]?.message
    })
  }
  
  /**
   * Get recent invalid responses for debugging
   */
  getInvalidResponses(count: number = 10): InvalidResponseLog[] {
    return this.invalidResponses.slice(-count)
  }
  
  /**
   * Get invalid response statistics
   */
  getInvalidResponseStats(): {
    totalInvalid: number
    recentErrors: string[]
    averageRetries: number
  } {
    const recentResponses = this.invalidResponses.slice(-50)
    const errorMessages = recentResponses
      .flatMap(log => log.errors.map(e => e.message))
      .slice(0, 10)
    
    const totalRetries = recentResponses.reduce((sum, log) => sum + log.retryCount, 0)
    const averageRetries = recentResponses.length > 0 ? totalRetries / recentResponses.length : 0
    
    return {
      totalInvalid: this.invalidResponses.length,
      recentErrors: errorMessages,
      averageRetries
    }
  }
  
  /**
   * Utility function for delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * Simulate retry response modification
   * In a real implementation, this would involve re-prompting the AI
   */
  private simulateRetryResponse(originalResponse: string, retryCount: number): string {
    // This is a simulation - in reality, you'd re-prompt the AI with feedback
    console.log(`Simulating retry ${retryCount} for response`)
    
    // For demonstration, we'll just return the original response
    // A real implementation would modify the prompt to encourage JSON format
    return originalResponse
  }
  
  /**
   * Validate if a response is properly formatted JSON
   */
  isJSONResponse(response: string): boolean {
    try {
      // Clean response like in parseAndValidateAIResponse
      let cleanResponse = response.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.substring(7)
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.substring(3)
      }
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.slice(0, -3)
      }
      cleanResponse = cleanResponse.trim()
      
      JSON.parse(cleanResponse)
      return true
    } catch {
      return false
    }
  }
  
  /**
   * Get service configuration
   */
  getConfig(): AIServiceConfig {
    return { ...this.config }
  }
  
  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Export for use in other modules