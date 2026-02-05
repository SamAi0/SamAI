/**
 * Virtual Filesystem Layer - Phase 2
 * 
 * In-memory filesystem that tracks file states and changes.
 * Provides diff generation and preview capabilities.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { validateWorkspacePath } from '@/lib/security/file-access-control.node'
import { securityAudit } from '@/lib/security/audit-logger'

// File State Interface
export interface VirtualFile {
  path: string
  content: string
  originalContent: string
  exists: boolean
  originalExists: boolean
  isModified: boolean
  createdAt: Date
  updatedAt: Date
}

// Virtual Filesystem Interface
export interface VirtualFilesystem {
  files: Map<string, VirtualFile>
  workspaceRoot: string
  taskId: string
  userId: string
}

// Diff Types
export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged'
export type ChangeType = 'create' | 'update' | 'delete' | 'read'

// Line Diff Interface
export interface LineDiff {
  lineNumber: number
  type: DiffType
  content: string
  originalContent?: string
}

// File Diff Interface
export interface FileDiff {
  path: string
  type: ChangeType
  originalExists: boolean
  newExists: boolean
  lineDiffs: LineDiff[]
  summary: {
    added: number
    removed: number
    modified: number
    unchanged: number
  }
}

/**
 * Virtual Filesystem Class
 */
export class VirtualFilesystemLayer {
  private fs: VirtualFilesystem
  
  constructor(taskId: string, userId: string, workspaceRoot: string) {
    this.fs = {
      files: new Map(),
      workspaceRoot,
      taskId,
      userId
    }
    
    securityAudit.logAccessAttempt('vfs_init', workspaceRoot, userId)
  }
  
  /**
   * Load file into virtual filesystem
   */
  async loadFile(filePath: string): Promise<VirtualFile> {
    validateWorkspacePath(filePath, 'vfs_load_file')
    
    const fullPath = path.join(this.fs.workspaceRoot, filePath)
    const fileKey = this.normalizePath(filePath)
    
    // Check if already loaded
    if (this.fs.files.has(fileKey)) {
      return this.fs.files.get(fileKey)!
    }
    
    try {
      // Read file content
      const content = await fs.readFile(fullPath, 'utf8')
      
      const virtualFile: VirtualFile = {
        path: filePath,
        content,
        originalContent: content,
        exists: true,
        originalExists: true,
        isModified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      this.fs.files.set(fileKey, virtualFile)
      securityAudit.logPathValidated('vfs_file_loaded', filePath, fullPath)
      
      return virtualFile
      
    } catch (error) {
      // File doesn't exist - create empty virtual file
      const virtualFile: VirtualFile = {
        path: filePath,
        content: '',
        originalContent: '',
        exists: false,
        originalExists: false,
        isModified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      this.fs.files.set(fileKey, virtualFile)
      return virtualFile
    }
  }
  
  /**
   * Create file in virtual filesystem
   */
  createFile(filePath: string, content: string): VirtualFile {
    validateWorkspacePath(filePath, 'vfs_create_file')
    
    const fileKey = this.normalizePath(filePath)
    
    const virtualFile: VirtualFile = {
      path: filePath,
      content,
      originalContent: '',
      exists: true,
      originalExists: false,
      isModified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.fs.files.set(fileKey, virtualFile)
    securityAudit.logAccessAttempt('vfs_file_created', filePath, this.fs.userId)
    
    return virtualFile
  }
  
  /**
   * Update file in virtual filesystem
   */
  updateFile(filePath: string, newContent: string): VirtualFile {
    validateWorkspacePath(filePath, 'vfs_update_file')
    
    const fileKey = this.normalizePath(filePath)
    const existingFile = this.fs.files.get(fileKey)
    
    if (!existingFile) {
      throw new Error(`File not loaded: ${filePath}`)
    }
    
    // Update content and mark as modified
    existingFile.content = newContent
    existingFile.exists = true
    existingFile.isModified = existingFile.originalContent !== newContent
    existingFile.updatedAt = new Date()
    
    securityAudit.logAccessAttempt('vfs_file_updated', filePath, this.fs.userId)
    
    return existingFile
  }
  
  /**
   * Delete file in virtual filesystem
   */
  deleteFile(filePath: string): VirtualFile {
    validateWorkspacePath(filePath, 'vfs_delete_file')
    
    const fileKey = this.normalizePath(filePath)
    const existingFile = this.fs.files.get(fileKey)
    
    if (!existingFile) {
      throw new Error(`File not loaded: ${filePath}`)
    }
    
    // Mark as deleted
    existingFile.exists = false
    existingFile.isModified = existingFile.originalExists // Only modified if it originally existed
    existingFile.updatedAt = new Date()
    
    securityAudit.logAccessAttempt('vfs_file_deleted', filePath, this.fs.userId)
    
    return existingFile
  }
  
  /**
   * Get file from virtual filesystem
   */
  getFile(filePath: string): VirtualFile | undefined {
    const fileKey = this.normalizePath(filePath)
    return this.fs.files.get(fileKey)
  }
  
  /**
   * Check if file exists in virtual filesystem
   */
  fileExists(filePath: string): boolean {
    const fileKey = this.normalizePath(filePath)
    const file = this.fs.files.get(fileKey)
    return file ? file.exists : false
  }
  
  /**
   * Get all modified files
   */
  getModifiedFiles(): VirtualFile[] {
    return Array.from(this.fs.files.values()).filter(file => file.isModified)
  }
  
  /**
   * Get all files (modified and unmodified)
   */
  getAllFiles(): VirtualFile[] {
    return Array.from(this.fs.files.values())
  }
  
  /**
   * Generate diff for a specific file
   */
  generateFileDiff(filePath: string): FileDiff {
    const file = this.getFile(filePath)
    if (!file) {
      throw new Error(`File not found: ${filePath}`)
    }
    
    const lineDiffs: LineDiff[] = []
    let added = 0
    let removed = 0
    let modified = 0
    let unchanged = 0
    
    if (file.originalExists && file.exists) {
      // File was updated
      const oldLines = file.originalContent.split('\n')
      const newLines = file.content.split('\n')
      const maxLines = Math.max(oldLines.length, newLines.length)
      
      for (let i = 0; i < maxLines; i++) {
        const oldLine = i < oldLines.length ? oldLines[i] : undefined
        const newLine = i < newLines.length ? newLines[i] : undefined
        
        if (oldLine === newLine) {
          if (oldLine !== undefined) {
            lineDiffs.push({
              lineNumber: i + 1,
              type: 'unchanged',
              content: oldLine
            })
            unchanged++
          }
        } else {
          if (oldLine !== undefined) {
            lineDiffs.push({
              lineNumber: i + 1,
              type: 'removed',
              content: oldLine
            })
            removed++
          }
          if (newLine !== undefined) {
            lineDiffs.push({
              lineNumber: i + 1,
              type: 'added',
              content: newLine,
              originalContent: oldLine
            })
            added++
          }
        }
      }
      
      // If content is completely different, mark as modified
      if (added > 0 || removed > 0) {
        modified = 1
        added = 0
        removed = 0
      }
      
    } else if (!file.originalExists && file.exists) {
      // New file
      const lines = file.content.split('\n')
      lines.forEach((line, index) => {
        lineDiffs.push({
          lineNumber: index + 1,
          type: 'added',
          content: line
        })
        added++
      })
      
    } else if (file.originalExists && !file.exists) {
      // Deleted file
      const lines = file.originalContent.split('\n')
      lines.forEach((line, index) => {
        lineDiffs.push({
          lineNumber: index + 1,
          type: 'removed',
          content: line
        })
        removed++
      })
    }
    
    return {
      path: file.path,
      type: this.getChangeType(file),
      originalExists: file.originalExists,
      newExists: file.exists,
      lineDiffs,
      summary: {
        added,
        removed,
        modified,
        unchanged
      }
    }
  }
  
  /**
   * Generate diffs for all modified files
   */
  generateAllDiffs(): FileDiff[] {
    const modifiedFiles = this.getModifiedFiles()
    return modifiedFiles.map(file => this.generateFileDiff(file.path))
  }
  
  /**
   * Apply changes to disk (accept)
   */
  async applyChanges(): Promise<{ success: boolean; errors: string[] }> {
    const modifiedFiles = this.getModifiedFiles()
    const errors: string[] = []
    
    securityAudit.logAccessAttempt('vfs_apply_changes', `files:${modifiedFiles.length}`, this.fs.userId)
    
    for (const file of modifiedFiles) {
      try {
        const fullPath = path.join(this.fs.workspaceRoot, file.path)
        
        if (file.exists) {
          // Create directory if needed
          const dirPath = path.dirname(fullPath)
          await fs.mkdir(dirPath, { recursive: true })
          
          // Write file
          await fs.writeFile(fullPath, file.content, 'utf8')
        } else if (file.originalExists) {
          // Delete file
          await fs.unlink(fullPath)
        }
        
        // Update original state
        file.originalContent = file.content
        file.originalExists = file.exists
        file.isModified = false
        
      } catch (error) {
        const errorMessage = `Failed to apply changes to ${file.path}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMessage)
        securityAudit.logViolationBlocked('vfs_apply_failed', file.path, { error: errorMessage })
      }
    }
    
    return {
      success: errors.length === 0,
      errors
    }
  }
  
  /**
   * Discard changes (reject)
   */
  discardChanges(): void {
    securityAudit.logAccessAttempt('vfs_discard_changes', `files:${this.getModifiedFiles().length}`, this.fs.userId)
    
    for (const file of this.fs.files.values()) {
      file.content = file.originalContent
      file.exists = file.originalExists
      file.isModified = false
    }
  }
  
  /**
   * Get filesystem statistics
   */
  getStats(): {
    totalFiles: number
    modifiedFiles: number
    createdFiles: number
    deletedFiles: number
    updatedFiles: number
  } {
    const allFiles = this.getAllFiles()
    const modifiedFiles = this.getModifiedFiles()
    
    const createdFiles = modifiedFiles.filter(f => !f.originalExists && f.exists).length
    const deletedFiles = modifiedFiles.filter(f => f.originalExists && !f.exists).length
    const updatedFiles = modifiedFiles.filter(f => f.originalExists && f.exists && f.isModified).length
    
    return {
      totalFiles: allFiles.length,
      modifiedFiles: modifiedFiles.length,
      createdFiles,
      deletedFiles,
      updatedFiles
    }
  }
  
  /**
   * Helper methods
   */
  private normalizePath(filePath: string): string {
    return path.normalize(filePath).replace(/\\/g, '/')
  }
  
  private getChangeType(file: VirtualFile): ChangeType {
    if (!file.originalExists && file.exists) return 'create'
    if (file.originalExists && !file.exists) return 'delete'
    if (file.originalExists && file.exists && file.isModified) return 'update'
    return 'read'
  }
  
  // Getters
  getWorkspaceRoot(): string { return this.fs.workspaceRoot }
  getTaskId(): string { return this.fs.taskId }
  getUserId(): string { return this.fs.userId }
  getContext(): VirtualFilesystem { return { ...this.fs } }
}

// Export for use in other modules