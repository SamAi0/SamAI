/**
 * Action-Based AI Schema - Phase 1
 * 
 * Strict schema definition for AI actions.
 * All AI responses must conform to this structure.
 */

// Core Action Types
export type ActionType = 'create_file' | 'update_file' | 'delete_file' | 'read_file' | 'list_files' | 'execute_command'

// Individual Action Interface
export interface Action {
  type: ActionType
  path: string
  content?: string | null
  patch?: string | null
  command?: string | null
  recursive?: boolean // For list_files
}

// Main Schema Interface
export interface ActionSchema {
  thought: string
  actions: Action[]
}

// Validation Error Interface
export interface ValidationError {
  field: string
  message: string
  value?: any
}

/**
 * Validate action schema
 * @param data - The data to validate
 * @returns Validation result with errors if invalid
 */
export function validateActionSchema(data: any): { 
  isValid: boolean; 
  errors: ValidationError[] 
} {
  const errors: ValidationError[] = []
  
  // Check if data exists
  if (!data) {
    errors.push({
      field: 'root',
      message: 'Data is required',
      value: data
    })
    return { isValid: false, errors }
  }
  
  // Validate thought field
  if (!data.thought || typeof data.thought !== 'string') {
    errors.push({
      field: 'thought',
      message: 'Thought must be a non-empty string',
      value: data.thought
    })
  }
  
  // Validate actions array
  if (!Array.isArray(data.actions)) {
    errors.push({
      field: 'actions',
      message: 'Actions must be an array',
      value: data.actions
    })
    return { isValid: false, errors }
  }
  
  // Validate each action
  data.actions.forEach((action: any, index: number) => {
    const actionPath = `actions[${index}]`
    
    // Validate type
    const validTypes: ActionType[] = ['create_file', 'update_file', 'delete_file', 'read_file', 'list_files', 'execute_command']
    if (!action.type || !validTypes.includes(action.type)) {
      errors.push({
        field: `${actionPath}.type`,
        message: `Invalid action type. Must be one of: ${validTypes.join(', ')}`,
        value: action.type
      })
    }
    
    // Validate path (required for file operations)
    if (['create_file', 'update_file', 'delete_file', 'read_file', 'list_files'].includes(action.type)) {
      if (!action.path || typeof action.path !== 'string') {
        errors.push({
          field: `${actionPath}.path`,
          message: 'Path is required for file operations and must be a string',
          value: action.path
        })
      }
    }
    
    // Validate content for create/update
    if (action.type === 'create_file' || action.type === 'update_file') {
      if (action.content === undefined && action.patch === undefined) {
        errors.push({
          field: `${actionPath}`,
          message: 'Either content or patch must be provided for create/update operations',
          value: action
        })
      }
      if (action.content !== undefined && action.content !== null && typeof action.content !== 'string') {
        errors.push({
          field: `${actionPath}.content`,
          message: 'Content must be a string or null',
          value: action.content
        })
      }
    }
    
    // Validate patch format
    if (action.patch !== undefined && action.patch !== null) {
      if (typeof action.patch !== 'string') {
        errors.push({
          field: `${actionPath}.patch`,
          message: 'Patch must be a string or null',
          value: action.patch
        })
      }
    }
    
    // Validate command for execute_command
    if (action.type === 'execute_command') {
      if (!action.command || typeof action.command !== 'string') {
        errors.push({
          field: `${actionPath}.command`,
          message: 'Command is required for execute_command and must be a string',
          value: action.command
        })
      }
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Parse JSON response and validate against schema
 * @param response - AI response string
 * @returns Parsed and validated data or error
 */
export function parseAndValidateAIResponse(response: string): {
  success: boolean
  data?: ActionSchema
  errors?: ValidationError[]
  rawResponse: string
} {
  try {
    // Clean the response (remove markdown code blocks if present)
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
    
    // Parse JSON
    const parsedData = JSON.parse(cleanResponse)
    
    // Validate against schema
    const validation = validateActionSchema(parsedData)
    
    if (validation.isValid) {
      return {
        success: true,
        data: parsedData as ActionSchema,
        rawResponse: response
      }
    } else {
      return {
        success: false,
        errors: validation.errors,
        rawResponse: response
      }
    }
    
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'parse',
        message: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        value: response
      }],
      rawResponse: response
    }
  }
}

// Types are already exported inline with interfaces