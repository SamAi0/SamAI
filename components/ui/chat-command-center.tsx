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
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// Types
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  status?: 'pending' | 'success' | 'error'
  actionPlan?: ActionPlan
}

interface ActionPlan {
  title: string
  description: string
  consequences: string[]
  filesAffected: string[]
  confidence: number
  estimatedTime: string
}

interface ChatCommandCenterProps {
  messages: ChatMessage[]
  onSendMessage: (content: string) => void
  onExecutePlan: (plan: ActionPlan) => void
  onRejectPlan: (plan: ActionPlan) => void
  className?: string
  isLoading?: boolean
}

// Message component
function ChatMessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  
  return (
    <div className={cn(
      "flex gap-3 py-4 px-4",
      isUser && "bg-blue-50"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-blue-500" : "bg-gray-200"
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
          <span className="text-xs text-gray-500">
            {message.timestamp.toLocaleTimeString()}
          </span>
          {message.status === 'pending' && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Clock className="w-3 h-3 mr-1" />
              Thinking...
            </Badge>
          )}
          {message.status === 'success' && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          )}
          {message.status === 'error' && (
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error
            </Badge>
          )}
        </div>
        
        {/* Message content */}
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {message.content}
        </div>
        
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
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            Potential Consequences
          </h5>
          <ul className="text-sm text-gray-600 space-y-1">
            {plan.consequences.map((consequence, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
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
        <div className="flex items-center gap-2 text-sm text-gray-500">
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

// Main Chat Command Center Component
export function ChatCommandCenter({ 
  messages, 
  onSendMessage,
  onExecutePlan,
  onRejectPlan,
  className,
  isLoading = false
}: ChatCommandCenterProps) {
  const [inputValue, setInputValue] = useState('')
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
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className={cn("flex flex-col h-full bg-white border", className)}>
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Command Center</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {messages.length} messages
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Chat with AI to plan and review code changes
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Bot className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to Command Center
            </h3>
            <p className="text-gray-500 max-w-md">
              Ask the AI to help you with code changes. It will analyze your request, 
              show you the planned actions, and let you review before executing.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3 py-4 px-4 bg-gray-50">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">AI Assistant</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Thinking...
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you'd like to change..."
              className="min-h-[44px] max-h-32 resize-none"
              disabled={isLoading}
            />
          </div>
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading}
            className="self-end h-[44px]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        
        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setInputValue('Create a new React component for user authentication')}
            disabled={isLoading}
            className="text-xs"
          >
            Create Component
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setInputValue('Refactor this function to use async/await')}
            disabled={isLoading}
            className="text-xs"
          >
            Refactor Code
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setInputValue('Add error handling to this API call')}
            disabled={isLoading}
            className="text-xs"
          >
            Add Error Handling
          </Button>
        </div>
      </div>
    </div>
  )
}

// Export types
export type { ChatMessage, ActionPlan }