'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Eye, 
  EyeOff, 
  Code, 
  GitCompare, 
  Save, 
  Undo2,
  Redo2,
  AlertTriangle,
  FileText,
  Check,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Types
interface FileContent {
  path: string
  content: string
  originalContent?: string
  language?: string
  isReadOnly?: boolean
}

interface DiffLine {
  lineNumber: number
  type: 'added' | 'removed' | 'unchanged' | 'modified'
  content: string
  originalContent?: string
}

interface FileEditorProps {
  file: FileContent | null
  onChange?: (content: string) => void
  onSave?: (content: string) => void
  onAccept?: () => void
  onReject?: () => void
  className?: string
}

// Language detection
const detectLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'json': 'json',
    'md': 'markdown',
    'css': 'css',
    'html': 'html',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'go': 'go',
    'rs': 'rust'
  }
  return languageMap[ext || ''] || 'plaintext'
}

// Simple syntax highlighting (basic implementation)
const highlightSyntax = (content: string, language: string): string => {
  // This is a simplified syntax highlighter
  // In a real implementation, you'd use a proper library like Prism or Highlight.js
  if (language === 'typescript' || language === 'javascript') {
    return content
      .replace(/(import|export|from|const|let|var|function|class|interface|type)/g, '<span class="text-blue-600 font-medium">$1</span>')
      .replace(/(true|false|null|undefined)/g, '<span class="text-purple-600">$1</span>')
      .replace(/("[^"]*"|'[^']*')/g, '<span class="text-green-600">$1</span>')
      .replace(/(\/\/[^\n]*)/g, '<span class="text-gray-500 italic">$1</span>')
  }
  return content
}

// Diff generator
const generateDiff = (original: string, current: string): DiffLine[] => {
  const originalLines = original.split('\n')
  const currentLines = current.split('\n')
  const maxLines = Math.max(originalLines.length, currentLines.length)
  const diffLines: DiffLine[] = []

  for (let i = 0; i < maxLines; i++) {
    const oldLine = i < originalLines.length ? originalLines[i] : undefined
    const newLine = i < currentLines.length ? currentLines[i] : undefined

    if (oldLine === newLine) {
      if (oldLine !== undefined) {
        diffLines.push({
          lineNumber: i + 1,
          type: 'unchanged',
          content: oldLine
        })
      }
    } else {
      if (oldLine !== undefined) {
        diffLines.push({
          lineNumber: i + 1,
          type: 'removed',
          content: oldLine
        })
      }
      if (newLine !== undefined) {
        diffLines.push({
          lineNumber: i + 1,
          type: 'added',
          content: newLine,
          originalContent: oldLine
        })
      }
    }
  }

  return diffLines
}

// Main File Editor Component
export function FileEditor({ 
  file, 
  onChange, 
  onSave, 
  onAccept,
  onReject,
  className 
}: FileEditorProps) {
  const [viewMode, setViewMode] = useState<'editor' | 'diff'>('editor')
  const [content, setContent] = useState('')
  const [isModified, setIsModified] = useState(false)
  const [diffLines, setDiffLines] = useState<DiffLine[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Update content when file changes
  useEffect(() => {
    if (file) {
      setContent(file.content)
      setIsModified(false)
      
      // Generate diff if we have original content
      if (file.originalContent && file.originalContent !== file.content) {
        setDiffLines(generateDiff(file.originalContent, file.content))
      } else {
        setDiffLines([])
      }
    }
  }, [file])

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setIsModified(true)
    onChange?.(newContent)
    
    // Update diff if we have original content
    if (file?.originalContent) {
      setDiffLines(generateDiff(file.originalContent, newContent))
    }
  }

  // Handle save
  const handleSave = () => {
    onSave?.(content)
    setIsModified(false)
  }

  // Handle accept
  const handleAccept = () => {
    onAccept?.()
    setIsModified(false)
  }

  // Handle reject
  const handleReject = () => {
    if (file?.originalContent !== undefined) {
      setContent(file.originalContent)
      handleContentChange(file.originalContent)
    }
    onReject?.()
  }

  // Get language for syntax highlighting
  const language = file ? detectLanguage(file.path) : 'plaintext'

  if (!file) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-gray-50", className)}>
        <div className="text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Select a file to view content</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-sm truncate max-w-xs">
            {file.path}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {language}
          </Badge>
          {isModified && (
            <Badge variant="default" className="bg-yellow-100 text-yellow-800">
              Modified
            </Badge>
          )}
          {file.isReadOnly && (
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              Read-only
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          {file.originalContent && file.originalContent !== file.content && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'editor' ? 'diff' : 'editor')}
              className="h-8"
            >
              {viewMode === 'editor' ? (
                <>
                  <GitCompare className="w-4 h-4 mr-2" />
                  Show Diff
                </>
              ) : (
                <>
                  <Code className="w-4 h-4 mr-2" />
                  Show Code
                </>
              )}
            </Button>
          )}
          
          {/* Action buttons */}
          {!file.isReadOnly && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!isModified}
                className="h-8"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              
              {onAccept && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAccept}
                  className="h-8 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accept
                </Button>
              )}
              
              {onReject && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  className="h-8"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'editor' ? (
          // Editor View
          <div className="h-full relative">
            {file.isReadOnly && (
              <div className="absolute top-0 left-0 right-0 bg-red-50 border-b border-red-200 p-2 z-10 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">
                  File is read-only. Accept changes to enable editing.
                </span>
              </div>
            )}
            
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              disabled={file.isReadOnly}
              className={cn(
                "w-full h-full p-4 font-mono text-sm resize-none border-0 focus:ring-0",
                file.isReadOnly && "bg-gray-50",
                file.isReadOnly && "pt-12" // Extra padding when readonly banner is shown
              )}
              style={{ 
                tabSize: 2,
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
              }}
              spellCheck={false}
            />
          </div>
        ) : (
          // Diff View
          <div className="h-full overflow-auto bg-gray-50">
            <div className="p-4 space-y-1 font-mono text-sm">
              {diffLines.map((line, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 px-2 py-1 rounded",
                    line.type === 'added' && "bg-green-50 text-green-800",
                    line.type === 'removed' && "bg-red-50 text-red-800",
                    line.type === 'modified' && "bg-yellow-50 text-yellow-800",
                    line.type === 'unchanged' && "hover:bg-gray-100"
                  )}
                >
                  <span className="text-gray-400 w-8 text-right select-none">
                    {line.lineNumber}
                  </span>
                  <span className="select-none">
                    {line.type === 'added' && '+'}
                    {line.type === 'removed' && '-'}
                    {line.type === 'modified' && '~'}
                    {line.type === 'unchanged' && ' '}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap">
                    {line.content}
                  </span>
                </div>
              ))}
              
              {diffLines.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No differences found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t bg-white text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>Lines: {content.split('\n').length}</span>
          <span>Characters: {content.length}</span>
          {diffLines.length > 0 && (
            <span>
              Changes: +{diffLines.filter(l => l.type === 'added').length} 
              -{diffLines.filter(l => l.type === 'removed').length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'editor' && !file.isReadOnly && (
            <>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <Undo2 className="w-3 h-3 mr-1" />
                Undo
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <Redo2 className="w-3 h-3 mr-1" />
                Redo
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Export types
export type { FileContent, DiffLine }