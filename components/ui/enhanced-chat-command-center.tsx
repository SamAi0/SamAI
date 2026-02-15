'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  Bot, 
  User, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Zap,
  MessageSquare,
  FilePlus,
  FolderPlus,
  Code,
  Download,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

// Types
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  status?: 'pending' | 'success' | 'error'
  actionPlan?: ActionPlan
  generatedCode?: GeneratedCodeBlock[]
}

interface ActionPlan {
  title: string
  description: string
  consequences: string[]
  filesAffected: string[]
  confidence: number
  estimatedTime: string
}

interface GeneratedCodeBlock {
  fileName: string
  filePath: string
  content: string
  language: string
  action: 'create' | 'update' | 'delete'
  originalContent?: string // For diff comparison
  diffLines?: DiffLine[] // Pre-calculated diff lines
}

interface SaveModalState {
  isOpen: boolean;
  codeBlock: GeneratedCodeBlock | null;
  fileName: string;
  filePath: string;
  folderPath: string;
}

interface EnhancedChatCommandCenterProps {
  messages: ChatMessage[]
  onSendMessage: (content: string) => void
  onExecutePlan: (plan: ActionPlan) => void
  onRejectPlan: (plan: ActionPlan) => void
  onCreateFile: (filePath: string, content: string) => void
  onMoveToProjectTree: (codeBlocks: GeneratedCodeBlock[]) => void
  className?: string
  isLoading?: boolean
  ollamaUrl?: string
}

// Message component
function ChatMessageItem({ message, onOpenSaveModal }: { message: ChatMessage, onOpenSaveModal: (codeBlock: GeneratedCodeBlock) => void }) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  
  // Extract code blocks if not already present
  const codeBlocks = message.generatedCode || extractCodeBlocks(message.content)
  
  return (
    <div className={cn(
      "flex gap-3 py-4 px-4",
      isUser && "bg-muted"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary" : "bg-muted"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-gray-600" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString()}
          </span>
          {message.status === 'pending' && (
            <Badge variant="secondary">
              <Clock className="w-3 h-3 mr-1" />
              Thinking...
            </Badge>
          )}
          {message.status === 'success' && (
            <Badge variant="default">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          )}
          {message.status === 'error' && (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error
            </Badge>
          )}
        </div>
        
        {/* Message content */}
        <div className="text-sm text-foreground whitespace-pre-wrap">
          {message.content}
        </div>
        
        {/* Generated code blocks */}
        {codeBlocks.length > 0 && (
          <div className="mt-3 space-y-3">
            <h5 className="font-medium text-sm text-gray-900 flex items-center gap-2">
              <Code className="w-4 h-4" />
              Generated Code
            </h5>
            
            {codeBlocks.map((codeBlock: GeneratedCodeBlock, idx: number) => (
              <div key={idx} className="border rounded-lg bg-gray-50 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-100">
                  <div className="flex items-center gap-2">
                    {codeBlock.action === 'create' ? (
                      <FilePlus className="w-4 h-4 text-green-600" />
                    ) : codeBlock.action === 'update' ? (
                      <FilePlus className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <FilePlus className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-mono text-sm">{codeBlock.filePath}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {codeBlock.language}
                  </Badge>
                </div>
                
                <div className="p-3 bg-white">
                  <pre className="whitespace-pre-wrap overflow-x-auto text-sm font-mono">
                    {codeBlock.content.substring(0, 500)}
                    {codeBlock.content.length > 500 && '...'}
                  </pre>
                  
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Copy Code
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default"
                      className="text-xs bg-blue-600 hover:bg-blue-700"
                      onClick={() => onOpenSaveModal(codeBlock)}
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save to Project
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Action plan */}
        {message.actionPlan && (
          <ActionPlanCard 
            plan={message.actionPlan}
            onExecute={() => {}}
            onReject={() => {}}
            className="mt-3"
          />
        )}
      </div>
    </div>
  )
}

// Action Plan Card Component
function ActionPlanCard({ 
  plan, 
  onExecute, 
  onReject,
  className 
}: { 
  plan: ActionPlan
  onExecute: () => void
  onReject: () => void
  className?: string
}) {
  return (
    <div className={cn("border rounded-lg bg-white shadow-sm", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">{plan.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
          </div>
          <Badge 
            variant={plan.confidence > 0.8 ? "default" : "secondary"}
            className={cn(
              plan.confidence > 0.8 ? "bg-green-100 text-green-800" : 
              plan.confidence > 0.6 ? "bg-yellow-100 text-yellow-800" : 
              "bg-red-100 text-red-800"
            )}
          >
            {Math.round(plan.confidence * 100)}% confidence
          </Badge>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Consequences */}
        <div>
          <h5 className="font-medium text-sm text-gray-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            Potential Consequences
          </h5>
          <ul className="text-sm text-gray-600 space-y-1">
            {plan.consequences.map((consequence, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground mt-1">•</span>
                {consequence}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Files affected */}
        <div>
          <h5 className="font-medium text-sm text-gray-900 mb-2">
            Files to be modified
          </h5>
          <div className="flex flex-wrap gap-1">
            {plan.filesAffected.map((file, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {file}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Estimated time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Estimated time: {plan.estimatedTime}</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t bg-gray-50 flex gap-2">
        <Button 
          onClick={onExecute}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <Zap className="w-4 h-4 mr-2" />
          Execute Plan
        </Button>
        <Button 
          variant="outline" 
          onClick={onReject}
          className="flex-1"
        >
          Reject
        </Button>
      </div>
    </div>
  )
}

// Extract code blocks from AI response - moved outside component to avoid recreation
const extractCodeBlocks = (content: string): GeneratedCodeBlock[] => {
  const codeBlocks: GeneratedCodeBlock[] = []
  const codeBlockRegex = /```(\w*)\s*\n([\s\S]*?)\n```/g
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'plaintext'
    const code = match[2]

    // Try to infer file path from surrounding text with improved matching
    // Look for various patterns indicating file creation
    const filePathPatterns = [
      /(?:creating|generating|new file|create)\s+(?:a|an)?\s+.*?\b([a-zA-Z0-9/_\-\.]+(?:\.[a-z]+)?)\b/i,
      /(?:todo|to-do|task|list).*?(?:in\s+)?([a-zA-Z0-9/_\-\.]+(?:\.[a-z]+)?)/i,
      /(?:html|javascript|typescript|css|python|java)(?:\s+(?:file|program|app|project))?/i
    ];
    
    let filePathMatch = null;
    let matchedPatternIndex = -1;
    
    for (let i = 0; i < filePathPatterns.length; i++) {
      const matchResult = content.substring(0, match.index).match(filePathPatterns[i]);
      if (matchResult && matchResult[1]) { // Make sure we have a capture group
        filePathMatch = matchResult;
        matchedPatternIndex = i;
        break;
      }
    }
    
    // Default file naming based on content analysis
    let fileName: string = `generated.${language}`;
    let filePath: string = `src/${fileName}`;
    
    if (filePathMatch && filePathMatch[1] && filePathMatch[1].length > 1) {
      // Validate that the captured path looks reasonable
      const capturedPath = filePathMatch[1];
      if (capturedPath.includes('.') || capturedPath.includes('/')) {
        fileName = capturedPath.split('/').pop() || `file.${language}`;
        filePath = capturedPath;
      } else {
        // Just a word, probably not a valid path
        filePathMatch = null;
      }
    }
    
    if (!filePathMatch) {
      // Analyze the code content to suggest appropriate filename
      if (language === 'html' && code.toLowerCase().includes('<!doctype')) {
        // HTML document - check if it's a todo list
        if (code.toLowerCase().includes('todo') || code.toLowerCase().includes('task') || code.toLowerCase().includes('list')) {
          fileName = 'todo-list.html';
          filePath = 'src/pages/todo-list.html';
        } else {
          fileName = 'index.html';
          filePath = 'src/index.html';
        }
      } else if (language === 'html') {
        fileName = 'component.html';
        filePath = 'src/components/component.html';
      } else {
        fileName = `generated.${language}`;
        filePath = `src/${fileName}`;
      }
    }

    codeBlocks.push({
      fileName,
      filePath,
      content: code,
      language,
      action: 'create' // Default to create, could be inferred differently
    })
  }

  return codeBlocks
}

// Diff line interface for displaying changes
interface DiffLine {
  lineNumber: number
  type: 'added' | 'removed' | 'unchanged' | 'modified'
  content: string
  originalContent?: string
}

// Generate diff between original and new content
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

// Main Enhanced Chat Command Center Component
export function EnhancedChatCommandCenter({ 
  messages = [], 
  onSendMessage,
  onExecutePlan,
  onRejectPlan,
  onCreateFile,
  onMoveToProjectTree,
  className 
}: EnhancedChatCommandCenterProps) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [selectedCodeBlock, setSelectedCodeBlock] = useState<GeneratedCodeBlock | null>(null)
  const [selectedFolder, setSelectedFolder] = useState('')
  const [customFileName, setCustomFileName] = useState('')
  const [diffModalOpen, setDiffModalOpen] = useState(false)
  const [diffContent, setDiffContent] = useState<{original: string, modified: string, diffLines: DiffLine[]} | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus textarea when component mounts
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isTyping) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  // Open save modal
  const handleOpenSaveModal = (codeBlock: GeneratedCodeBlock) => {
    setSelectedCodeBlock(codeBlock)
    setCustomFileName(codeBlock.fileName)
    setSelectedFolder(codeBlock.filePath.substring(0, codeBlock.filePath.lastIndexOf('/')) || 'src')
    setSaveModalOpen(true)
  };

  // Close save modal
  const handleCloseSaveModal = () => {
    setSaveModalOpen(false)
    setSelectedCodeBlock(null)
    setSelectedFolder('')
    setCustomFileName('')
  };

  // Handle save to project with diff review
  const handleSaveToProject = (codeBlock: GeneratedCodeBlock) => {
    setSelectedCodeBlock(codeBlock)
    setCustomFileName(codeBlock.fileName)
    
    // If this is an update action with original content, show diff
    if (codeBlock.action === 'update' && codeBlock.originalContent) {
      const diffLines = generateDiff(codeBlock.originalContent, codeBlock.content)
      setDiffContent({
        original: codeBlock.originalContent,
        modified: codeBlock.content,
        diffLines
      })
      setDiffModalOpen(true)
    } else {
      // For new files or create actions, go directly to save modal
      setSaveModalOpen(true)
    }
  }

  // Handle diff approval
  const handleApproveDiff = () => {
    setDiffModalOpen(false)
    setSaveModalOpen(true)
  }

  // Handle diff rejection
  const handleRejectDiff = () => {
    setDiffModalOpen(false)
    setSelectedCodeBlock(null)
  }

  // Handle final save after diff approval
  const handleFinalSave = () => {
    if (selectedCodeBlock) {
      const finalCodeBlock = {
        ...selectedCodeBlock,
        fileName: customFileName,
        filePath: `${selectedFolder}/${customFileName}`
      }
      
      onMoveToProjectTree?.([finalCodeBlock])
      setSaveModalOpen(false)
      setSelectedCodeBlock(null)
      setSelectedFolder('')
      setCustomFileName('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <>
      {/* Diff Review Modal */}
      <Dialog open={diffModalOpen} onOpenChange={setDiffModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Review Changes
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {diffContent && (
              <>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-900 mb-2">File: {selectedCodeBlock?.fileName}</h4>
                  <p className="text-sm text-gray-600">
                    Review the changes below before accepting. Added lines are shown in green, removed lines in red.
                  </p>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Changes: +{diffContent.diffLines.filter(l => l.type === 'added').length} -{diffContent.diffLines.filter(l => l.type === 'removed').length}</span>
                      <span>{diffContent.diffLines.length} lines total</span>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-auto font-mono text-sm">
                    {diffContent.diffLines.map((line, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-3 px-4 py-1 border-b border-gray-100 last:border-b-0",
                          line.type === 'added' && "bg-green-50",
                          line.type === 'removed' && "bg-red-50",
                          line.type === 'modified' && "bg-yellow-50"
                        )}
                      >
                        <span className="text-gray-400 w-12 text-right select-none text-xs">
                          {line.lineNumber}
                        </span>
                        <span className="select-none w-4 text-center">
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
                  </div>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleRejectDiff}>
              Reject Changes
            </Button>
            <Button onClick={handleApproveDiff} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve and Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save to Project Modal */}
      <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save to Project</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder">Select Folder</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="src">src</SelectItem>
                  <SelectItem value="src/components">src/components</SelectItem>
                  <SelectItem value="src/pages">src/pages</SelectItem>
                  <SelectItem value="src/utils">src/utils</SelectItem>
                  <SelectItem value="src/services">src/services</SelectItem>
                  <SelectItem value="public">public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="filename">File Name</Label>
              <Input
                id="filename"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="Enter file name"
              />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                File will be saved as: {selectedFolder}/{customFileName}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFinalSave} disabled={!selectedFolder || !customFileName}>
              <Save className="w-4 h-4 mr-2" />
              Save to Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Export types
export type { ChatMessage, ActionPlan, GeneratedCodeBlock }