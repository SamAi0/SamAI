'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  MessageSquare,
  Bot,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SmartChatInput } from './chat-input'
import { useOllamaHealth } from './ollama-health-checker'
import { cn } from '@/lib/utils'

// Types (reusing from previous implementation)
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

interface StableChatCommandCenterProps {
  messages: ChatMessage[]
  onSendMessage: (content: string) => void
  onExecutePlan: (plan: ActionPlan) => void
  onRejectPlan: (plan: ActionPlan) => void
  className?: string
  ollamaUrl?: string
  showHealthStatus?: boolean
}

// Message component (simplified version)
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
        </div>
        
        {/* Message content */}
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  )
}

// Main Stable Chat Component
export function StableChatCommandCenter({ 
  messages, 
  onSendMessage,
  onExecutePlan,
  onRejectPlan,
  className,
  ollamaUrl,
  showHealthStatus = true
}: StableChatCommandCenterProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isHealthy, status } = useOllamaHealth(ollamaUrl)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className={cn("flex flex-col h-full bg-white border", className)}>
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Command Center</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isHealthy ? "default" : "destructive"}
              className={cn(
                isHealthy ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              )}
            >
              {isHealthy ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {messages.length} messages
            </Badge>
          </div>
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
              {isHealthy 
                ? "Ask the AI to help you with code changes. It will analyze your request and show you the planned actions."
                : "Ollama is not available. Please start the Ollama service to enable AI features."
              }
            </p>
            
            {!isHealthy && (
              <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Connection Issue</span>
                </div>
                <p className="text-sm text-red-700">
                  {status.errorMessage || "Cannot connect to Ollama service on 127.0.0.1:11434"}
                </p>
                <div className="mt-3 text-xs text-red-600">
                  <p>Make sure Ollama is running:</p>
                  <code className="bg-red-100 px-2 py-1 rounded mt-1 inline-block">
                    ollama serve
                  </code>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-0">
            {messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <SmartChatInput
          onSendMessage={onSendMessage}
          placeholder={isHealthy 
            ? "Describe what you'd like to change..." 
            : "Ollama is not available - chat disabled"
          }
          disabled={!isHealthy}
          ollamaUrl={ollamaUrl}
          showHealthPanel={showHealthStatus}
        />
      </div>
    </div>
  )
}

// Export types
export type { ChatMessage, ActionPlan }