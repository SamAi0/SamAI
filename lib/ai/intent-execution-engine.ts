/**
 * Intent Execution Engine - Phase 1
 * 
 * Backend service that executes validated AI actions.
 * Performs operations in memory first and produces diffs.
 */

import { Action, ActionSchema, ActionType } from './action-schema'
import { validateWorkspacePath } from '@/lib/security/file-access-control.node'
import { securityAudit } from '@/lib/security/audit-logger'
import fs from 'fs/promises'
import path from 'path'

// Simple diff function since 'diff' package isn't available
function createSimpleDiff(oldContent: string, newContent: string, filePath: string): string {
  if (oldContent === newContent) return ''
  
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  const maxLength = Math.max(oldLines.length, newLines.length)
  
  let diff = `--- a/${filePath}\n+++ b/${filePath}\n`
  
  for (let i = 0; i < maxLength; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : undefined
    const newLine = i < newLines.length ? newLines[i] : undefined
    
    if (oldLine === newLine) {
      diff += ` ${oldLine || ''}\n`
    } else {
      if (oldLine !== undefined) diff += `-${oldLine}\n`
      if (newLine !== undefined) diff += `+${newLine}\n`
    }
  }
  
  return diff
}
export interface ExecutionResult {
  action: Action
  success: boolean
  output?: string
  error?: string
  diff?: string
  timestamp: Date
}

// File State Interface
export interface FileState {
  path: string
  content: string
  exists: boolean
}

// Execution Context Interface
export interface ExecutionContext {
  taskId: string
  userId: string
  workspaceRoot: string
  fileStates: Map<string, FileState>
  results: ExecutionResult[]
}

/**
 * Intent Execution Engine Class
 */
export class IntentExecutionEngine {
  private context: ExecutionContext
  
  constructor(taskId: string, userId: string, workspaceRoot: string) {
    this.context = {
      taskId,
      userId,
      workspaceRoot,
      fileStates: new Map(),
      results: []
    }
    
    securityAudit.logAccessAttempt('execution_engine_init', workspaceRoot, userId)
  }
  
  /**
   * Execute a validated action schema
   */
  async executeSchema(schema: ActionSchema): Promise<ExecutionResult[]> {
    securityAudit.logAccessAttempt('execute_schema', `actions:${schema.actions.length}`, this.context.userId)
    
    // Validate all actions first
    const validationResults = schema.actions.map(action => 
      this.validateActionInContext(action)
    )
    
    // If any action fails validation, reject the entire schema
    const invalidActions = validationResults.filter(result => !result.valid)
    if (invalidActions.length > 0) {
      const errors = invalidActions.map(inv => inv.error)
      securityAudit.logViolationBlocked('schema_execution', 'invalid_actions', { errors })
      throw new Error(`Schema validation failed: ${errors.join(', ')}`)
    }
    
    // Execute actions sequentially
    for (const action of schema.actions) {
      try {
        const result = await this.executeAction(action)
        this.context.results.push(result)
      } catch (error) {
        const result: ExecutionResult = {
          action,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
        this.context.results.push(result)
        securityAudit.logViolationBlocked('action_execution', action.path || 'unknown', { error: result.error })
      }
    }
    
    return this.context.results
  }
  
  /**
   * Validate action within execution context
   */
  private validateActionInContext(action: Action): { valid: boolean; error?: string } {
    try {
      // Validate workspace boundaries for file operations
      if (['create_file', 'update_file', 'delete_file', 'read_file', 'list_files'].includes(action.type)) {
        if (!action.path) {
          return { valid: false, error: 'Path is required for file operations' }
        }
        
        // Validate path security
        try {
          validateWorkspacePath(action.path, `action_${action.type}`)
        } catch (error) {
          return { valid: false, error: 'Path validation failed: Access denied' }
        }
      }
      
      return { valid: true }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      }
    }
  }
  
  /**
   * Execute a single action
   */
  private async executeAction(action: Action): Promise<ExecutionResult> {
    securityAudit.logAccessAttempt(`action_${action.type}`, action.path || 'no_path', this.context.userId)
    
    switch (action.type) {
      case 'create_file':
        return this.createFile(action)
      case 'update_file':
        return this.updateFile(action)
      case 'delete_file':
        return this.deleteFile(action)
      case 'read_file':
        return this.readFile(action)
      case 'list_files':
        return this.listFiles(action)
      case 'execute_command':
        return this.executeCommand(action)
      default:
        throw new Error(`Unsupported action type: ${action.type}`)
    }
  }
  
  /**
   * Create file action
   */
  private async createFile(action: Action): Promise<ExecutionResult> {
    if (!action.path) throw new Error('Path required for create_file')
    if (action.content === undefined && action.patch === undefined) {
      throw new Error('Content or patch required for create_file')
    }
    
    const fullPath = path.join(this.context.workspaceRoot, action.path)
    const content = action.content || ''
    
    // Check if file already exists
    try {
      await fs.access(fullPath)
      throw new Error('File already exists')
    } catch (error) {
      // File doesn't exist, which is what we want
    }
    
    // Create directory if needed
    const dirPath = path.dirname(fullPath)
    await fs.mkdir(dirPath, { recursive: true })
    
    // Write file
    await fs.writeFile(fullPath, content, 'utf8')
    
    // Update file state
    this.context.fileStates.set(action.path, {
      path: action.path,
      content,
      exists: true
    })
    
    return {
      action,
      success: true,
      output: `File created: ${action.path}`,
      diff: this.generateDiff('', content, action.path),
      timestamp: new Date()
    }
  }
  
  /**
   * Update file action
   */
  private async updateFile(action: Action): Promise<ExecutionResult> {
    if (!action.path) throw new Error('Path required for update_file')
    
    const fullPath = path.join(this.context.workspaceRoot, action.path)
    
    // Read current content
    let currentContent = ''
    try {
      currentContent = await fs.readFile(fullPath, 'utf8')
    } catch (error) {
      throw new Error('File does not exist')
    }
    
    // Apply update
    let newContent = currentContent
    if (action.content !== undefined) {
      newContent = action.content || ''
    } else if (action.patch) {
      // Apply patch logic would go here
      // For now, treat patch as replacement
      newContent = action.patch
    }
    
    // Write updated content
    await fs.writeFile(fullPath, newContent, 'utf8')
    
    // Update file state
    this.context.fileStates.set(action.path, {
      path: action.path,
      content: newContent,
      exists: true
    })
    
    return {
      action,
      success: true,
      output: `File updated: ${action.path}`,
      diff: this.generateDiff(currentContent, newContent, action.path),
      timestamp: new Date()
    }
  }
  
  /**
   * Delete file action
   */
  private async deleteFile(action: Action): Promise<ExecutionResult> {
    if (!action.path) throw new Error('Path required for delete_file')
    
    const fullPath = path.join(this.context.workspaceRoot, action.path)
    
    // Check if file exists
    try {
      await fs.access(fullPath)
    } catch (error) {
      throw new Error('File does not exist')
    }
    
    // Delete file
    await fs.unlink(fullPath)
    
    // Update file state
    this.context.fileStates.set(action.path, {
      path: action.path,
      content: '',
      exists: false
    })
    
    return {
      action,
      success: true,
      output: `File deleted: ${action.path}`,
      timestamp: new Date()
    }
  }
  
  /**
   * Read file action
   */
  private async readFile(action: Action): Promise<ExecutionResult> {
    if (!action.path) throw new Error('Path required for read_file')
    
    const fullPath = path.join(this.context.workspaceRoot, action.path)
    
    try {
      const content = await fs.readFile(fullPath, 'utf8')
      
      // Update file state
      this.context.fileStates.set(action.path, {
        path: action.path,
        content,
        exists: true
      })
      
      return {
        action,
        success: true,
        output: content,
        timestamp: new Date()
      }
    } catch (error) {
      throw new Error('File does not exist or cannot be read')
    }
  }
  
  /**
   * List files action
   */
  private async listFiles(action: Action): Promise<ExecutionResult> {
    if (!action.path) throw new Error('Path required for list_files')
    
    const fullPath = path.join(this.context.workspaceRoot, action.path)
    
    try {
      const files = await fs.readdir(fullPath, { withFileTypes: true })
      const fileList = files.map(file => ({
        name: file.name,
        type: file.isDirectory() ? 'directory' : 'file',
        path: path.join(action.path, file.name)
      }))
      
      return {
        action,
        success: true,
        output: JSON.stringify(fileList, null, 2),
        timestamp: new Date()
      }
    } catch (error) {
      throw new Error('Directory does not exist or cannot be read')
    }
  }
  
  /**
   * Execute command action
   */
  private async executeCommand(action: Action): Promise<ExecutionResult> {
    if (!action.command) throw new Error('Command required for execute_command')
    
    // Security: Block dangerous commands
    const dangerousCommands = ['rm', 'del', 'format', 'shutdown', 'reboot']
    const commandParts = action.command.split(' ')
    const baseCommand = commandParts[0].toLowerCase()
    
    if (dangerousCommands.includes(baseCommand)) {
      throw new Error(`Command blocked for security: ${baseCommand}`)
    }
    
    // Execute command (in real implementation, this would be more sophisticated)
    const output = `Command executed: ${action.command}\n(Note: Command execution is simulated in this demo)`
    
    return {
      action,
      success: true,
      output,
      timestamp: new Date()
    }
  }
  
  /**
   * Generate diff between old and new content
   */
  private generateDiff(oldContent: string, newContent: string, filePath: string): string {
    return createSimpleDiff(oldContent, newContent, filePath)
  }
  
  /**
   * Get execution context
   */
  getContext(): ExecutionContext {
    return { ...this.context }
  }
  
  /**
   * Get execution results
   */
  getResults(): ExecutionResult[] {
    return [...this.context.results]
  }
}

// Export for use in other modules