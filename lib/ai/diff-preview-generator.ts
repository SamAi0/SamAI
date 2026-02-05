/**
 * Diff Preview Generator - Phase 2
 * 
 * Generates human-readable diffs and previews for AI changes.
 * Supports line-by-line diffs, file previews, and delete confirmations.
 */

import { VirtualFilesystemLayer, FileDiff, LineDiff } from './virtual-filesystem'

// Preview Types
export type PreviewType = 'full' | 'diff' | 'confirmation'

// Preview Content Interface
export interface PreviewContent {
  type: PreviewType
  filePath: string
  title: string
  content: string
  metadata: {
    linesAdded: number
    linesRemoved: number
    linesModified: number
    totalLines: number
  }
  actions: PreviewAction[]
}

// Preview Action Interface
export interface PreviewAction {
  id: string
  label: string
  type: 'accept' | 'reject' | 'partial' | 'view_original'
  primary?: boolean
  danger?: boolean
}

// Delete Confirmation Interface
export interface DeleteConfirmation {
  filePath: string
  originalContent: string
  lineCount: number
  fileSize: number
  warning: string
}

/**
 * Diff Preview Generator Class
 */
export class DiffPreviewGenerator {
  private vfs: VirtualFilesystemLayer
  
  constructor(virtualFilesystem: VirtualFilesystemLayer) {
    this.vfs = virtualFilesystem
  }
  
  /**
   * Generate preview for a modified file
   */
  generateFilePreview(filePath: string): PreviewContent {
    const file = this.vfs.getFile(filePath)
    if (!file) {
      throw new Error(`File not found: ${filePath}`)
    }
    
    const fileDiff = this.vfs.generateFileDiff(filePath)
    
    if (!file.originalExists && file.exists) {
      // New file - show full content preview
      return this.generateNewFilePreview(file.path, file.content, fileDiff)
    } else if (file.originalExists && !file.exists) {
      // Deleted file - show confirmation
      return this.generateDeleteConfirmation(file.path, file.originalContent, fileDiff)
    } else {
      // Updated file - show diff
      return this.generateDiffPreview(file.path, fileDiff)
    }
  }
  
  /**
   * Generate previews for all modified files
   */
  generateAllPreviews(): PreviewContent[] {
    const modifiedFiles = this.vfs.getModifiedFiles()
    return modifiedFiles.map(file => this.generateFilePreview(file.path))
  }
  
  /**
   * Generate full file preview for new files
   */
  private generateNewFilePreview(filePath: string, content: string, fileDiff: FileDiff): PreviewContent {
    const lines = content.split('\n')
    const lineCount = lines.length
    
    // Format content with line numbers
    const formattedContent = lines
      .map((line, index) => `${(index + 1).toString().padStart(4, ' ')} | ${line}`)
      .join('\n')
    
    return {
      type: 'full',
      filePath,
      title: `📄 New File: ${filePath}`,
      content: formattedContent,
      metadata: {
        linesAdded: lineCount,
        linesRemoved: 0,
        linesModified: 0,
        totalLines: lineCount
      },
      actions: [
        {
          id: `accept-new-${filePath}`,
          label: 'Accept New File',
          type: 'accept',
          primary: true
        },
        {
          id: `reject-new-${filePath}`,
          label: 'Reject',
          type: 'reject',
          danger: true
        }
      ]
    }
  }
  
  /**
   * Generate diff preview for updated files
   */
  private generateDiffPreview(filePath: string, fileDiff: FileDiff): PreviewContent {
    const { lineDiffs, summary } = fileDiff
    
    // Generate unified diff format
    let diffContent = `--- a/${filePath}\n+++ b/${filePath}\n`
    
    lineDiffs.forEach(diff => {
      switch (diff.type) {
        case 'added':
          diffContent += `+${diff.lineNumber.toString().padStart(4, ' ')} | ${diff.content}\n`
          break
        case 'removed':
          diffContent += `-${diff.lineNumber.toString().padStart(4, ' ')} | ${diff.content}\n`
          break
        case 'unchanged':
          diffContent += ` ${diff.lineNumber.toString().padStart(4, ' ')} | ${diff.content}\n`
          break
      }
    })
    
    return {
      type: 'diff',
      filePath,
      title: `📝 Updated File: ${filePath}`,
      content: diffContent,
      metadata: {
        linesAdded: summary.added,
        linesRemoved: summary.removed,
        linesModified: summary.modified,
        totalLines: lineDiffs.length
      },
      actions: [
        {
          id: `accept-update-${filePath}`,
          label: 'Accept Changes',
          type: 'accept',
          primary: true
        },
        {
          id: `reject-update-${filePath}`,
          label: 'Reject Changes',
          type: 'reject',
          danger: true
        },
        {
          id: `partial-update-${filePath}`,
          label: 'Partial Accept',
          type: 'partial'
        },
        {
          id: `view-original-${filePath}`,
          label: 'View Original',
          type: 'view_original'
        }
      ]
    }
  }
  
  /**
   * Generate delete confirmation
   */
  private generateDeleteConfirmation(filePath: string, originalContent: string, fileDiff: FileDiff): PreviewContent {
    const lines = originalContent.split('\n')
    const lineCount = lines.length
    const fileSize = Buffer.byteLength(originalContent, 'utf8')
    
    // Show first 20 lines of the file being deleted
    const previewLines = lines.slice(0, 20)
    const formattedPreview = previewLines
      .map((line, index) => `${(index + 1).toString().padStart(4, ' ')} | ${line}`)
      .join('\n')
    
    const additionalLines = lineCount > 20 ? `\n\n... and ${lineCount - 20} more lines` : ''
    
    const warning = `⚠️  You are about to DELETE this file!\n` +
                   `File: ${filePath}\n` +
                   `Size: ${fileSize} bytes\n` +
                   `Lines: ${lineCount}\n\n` +
                   `First 20 lines of content:\n`
    
    return {
      type: 'confirmation',
      filePath,
      title: `🗑️  Delete File: ${filePath}`,
      content: warning + formattedPreview + additionalLines,
      metadata: {
        linesAdded: 0,
        linesRemoved: lineCount,
        linesModified: 0,
        totalLines: lineCount
      },
      actions: [
        {
          id: `confirm-delete-${filePath}`,
          label: 'Confirm Delete',
          type: 'accept',
          primary: true,
          danger: true
        },
        {
          id: `cancel-delete-${filePath}`,
          label: 'Cancel',
          type: 'reject'
        }
      ]
    }
  }
  
  /**
   * Generate summary preview of all changes
   */
  generateSummaryPreview(): PreviewContent {
    const stats = this.vfs.getStats()
    const diffs = this.vfs.generateAllDiffs()
    
    let summaryContent = `## 📊 Change Summary\n\n`
    summaryContent += `**Files to be modified: ${stats.modifiedFiles}**\n\n`
    
    if (stats.createdFiles > 0) {
      summaryContent += `### 📄 New Files (${stats.createdFiles})\n`
      diffs
        .filter(d => d.type === 'create')
        .forEach(diff => {
          summaryContent += `- ${diff.path} (${diff.summary.added} lines)\n`
        })
      summaryContent += '\n'
    }
    
    if (stats.updatedFiles > 0) {
      summaryContent += `### 📝 Updated Files (${stats.updatedFiles})\n`
      diffs
        .filter(d => d.type === 'update')
        .forEach(diff => {
          summaryContent += `- ${diff.path} (+${diff.summary.added} -${diff.summary.removed})\n`
        })
      summaryContent += '\n'
    }
    
    if (stats.deletedFiles > 0) {
      summaryContent += `### 🗑️  Deleted Files (${stats.deletedFiles})\n`
      diffs
        .filter(d => d.type === 'delete')
        .forEach(diff => {
          summaryContent += `- ${diff.path} (${diff.summary.removed} lines)\n`
        })
      summaryContent += '\n'
    }
    
    // Overall statistics
    const totalAdded = diffs.reduce((sum, diff) => sum + diff.summary.added, 0)
    const totalRemoved = diffs.reduce((sum, diff) => sum + diff.summary.removed, 0)
    
    summaryContent += `### 📈 Overall Changes\n`
    summaryContent += `- Lines added: ${totalAdded}\n`
    summaryContent += `- Lines removed: ${totalRemoved}\n`
    summaryContent += `- Net change: ${totalAdded - totalRemoved}\n`
    
    return {
      type: 'full',
      filePath: 'SUMMARY',
      title: '📋 Summary of All Changes',
      content: summaryContent,
      metadata: {
        linesAdded: totalAdded,
        linesRemoved: totalRemoved,
        linesModified: 0,
        totalLines: totalAdded + totalRemoved
      },
      actions: [
        {
          id: 'accept-all',
          label: 'Accept All Changes',
          type: 'accept',
          primary: true
        },
        {
          id: 'reject-all',
          label: 'Reject All Changes',
          type: 'reject',
          danger: true
        }
      ]
    }
  }
  
  /**
   * Get simplified diff for quick review
   */
  getQuickDiff(filePath: string): string {
    const fileDiff = this.vfs.generateFileDiff(filePath)
    const { summary } = fileDiff
    
    if (fileDiff.type === 'create') {
      return `+ ${filePath} (${summary.added} lines)`
    } else if (fileDiff.type === 'delete') {
      return `- ${filePath} (${summary.removed} lines)`
    } else {
      return `~ ${filePath} (+${summary.added} -${summary.removed})`
    }
  }
  
  /**
   * Get all quick diffs for modified files
   */
  getAllQuickDiffs(): string[] {
    const modifiedFiles = this.vfs.getModifiedFiles()
    return modifiedFiles.map(file => this.getQuickDiff(file.path))
  }
}

// Export for use in other modules