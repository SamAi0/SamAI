'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  Bot, 
  User, 
  AlertCircle,
  WifiOff,
  ServerOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useOllamaHealth, OllamaHealthChecker } from './ollama-health-checker'
import { cn } from '@/lib/utils'

// Types
interface ChatInputProps {
  onSendMessage: (content: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  ollamaUrl?: string
}

// Main Chat Input Component
export function ChatInput({ 
  onSendMessage,
  placeholder = "Describe what you'd like to change...",
  className,
  disabled = false,
  ollamaUrl
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { status: ollamaStatus, isHealthy } = useOllamaHealth(ollamaUrl)

  // Auto-focus textarea
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputValue.trim() || disabled || !isHealthy || isSending) {
      return
    }

    setIsSending(true)
    try {
      await onSendMessage(inputValue.trim())
      setInputValue('')
    } finally {
      setIsSending(false)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
    
    // New line on Shift+Enter
    if (e.key === 'Enter' && e.shiftKey) {
      // Default behavior (new line) - no preventDefault
    }
  }

  // Check if input should be disabled
  const isInputDisabled = disabled || !isHealthy || isSending

  // Get appropriate placeholder text
  const getPlaceholder = () => {
    if (!isHealthy) {
      return "Ollama is not available - chat disabled"
    }
    if (isSending) {
      return "Sending message..."
    }
    return placeholder
  }

  // Get error message based on Ollama status
  const getErrorMessage = () => {
    if (!ollamaStatus.lastChecked || ollamaStatus.lastChecked.getTime() === 0) {
      return "Checking Ollama connection..."
    }
    
    if (!ollamaStatus.isHealthy) {
      return ollamaStatus.errorMessage || "Cannot connect to Ollama service"
    }
    
    return null
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Error Alert */}
      {!isHealthy && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            <ServerOff className="w-4 h-4" />
            {getErrorMessage()}
          </AlertDescription>
        </Alert>
      )}

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className={cn(
              "min-h-[44px] max-h-32 resize-none pr-12",
              !isHealthy && "bg-gray-50 border-gray-300"
            )}
            disabled={isInputDisabled}
          />
          
          {/* Character counter */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {inputValue.length}/1000
          </div>
        </div>
        
        <Button 
          type="submit" 
          disabled={isInputDisabled}
          className="self-end h-[44px] min-w-[44px] p-0"
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>

      {/* Quick Actions (only when healthy) */}
      {isHealthy && (
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setInputValue('Create a new React component for user authentication')}
            disabled={isInputDisabled}
            className="text-xs"
          >
            Create Component
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setInputValue('Refactor this function to use async/await')}
            disabled={isInputDisabled}
            className="text-xs"
          >
            Refactor Code
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setInputValue('Add error handling to this API call')}
            disabled={isInputDisabled}
            className="text-xs"
          >
            Add Error Handling
          </Button>
        </div>
      )}

      {/* Connection Status Indicator */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {isHealthy ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Ollama connected</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Ollama disconnected</span>
            </>
          )}
        </div>
        
        {isSending && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Sending...</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced version with integrated health checker
interface SmartChatInputProps extends ChatInputProps {
  showHealthPanel?: boolean
}

export function SmartChatInput({ 
  showHealthPanel = true,
  ollamaUrl,
  ...props
}: SmartChatInputProps) {
  return (
    <div className="space-y-4">
      {showHealthPanel && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">System Status</h4>
          <OllamaHealthChecker ollamaUrl={ollamaUrl} />
        </div>
      )}
      
      <ChatInput 
        ollamaUrl={ollamaUrl}
        {...props}
      />
    </div>
  )
}

// Export the health checker component as well
export { OllamaHealthChecker } from './ollama-health-checker'