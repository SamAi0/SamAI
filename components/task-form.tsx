'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Loader2,
  ArrowUp,
  Settings,
  X,
  Cable,
  Users,
  Bot,
  CircleAlert,
  CircleCheck,
  Circle,
  AlertTriangle,
} from 'lucide-react'

import { setInstallDependencies, setMaxDuration, setKeepAlive } from '@/lib/utils/cookies'
import { TokenLimiter } from '@/lib/utils/token-limiter'
import { useConnectors } from '@/components/connectors-provider'
import { ConnectorDialog } from '@/components/connectors/manage-connectors'
import { toast } from 'sonner'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { taskPromptAtom } from '@/lib/atoms/task'
import { lastSelectedAgentAtom, lastSelectedModelAtomFamily } from '@/lib/atoms/agent-selection'
import { useSearchParams } from 'next/navigation'
import { AGENT_MODELS, DEFAULT_MODELS } from '@/lib/constants'

interface Repo {
  name: string
  full_name: string
  description: string
  private: boolean
  clone_url: string
  language: string
}

interface TaskFormProps {
  onSubmit: (data: {
    prompt: string
    selectedAgent: string
    selectedModel: string
    selectedModels?: string[]
    installDependencies: boolean
    maxDuration: number
    keepAlive: boolean
  }) => void
  isSubmitting: boolean
  initialInstallDependencies?: boolean
  initialMaxDuration?: number
  initialKeepAlive?: boolean
  maxSandboxDuration?: number
}

const CODING_AGENTS = [
  { value: 'ollama', label: 'Ollama', icon: Bot, isLogo: true }, // Only Ollama is supported
] as const

// API key requirements for each agent
const AGENT_API_KEY_REQUIREMENTS: Record<string, Provider[]> = {
  ollama: [], // No API key required for local Ollama
}

type Provider = 'openai' | 'gemini' | 'cursor' | 'anthropic'

// Helper to determine which API key is needed for opencode based on model
const getOpenCodeRequiredKeys = (model: string): Provider[] => {
  // Check if it's an Anthropic model (claude models)
  if (model.includes('claude') || model.includes('sonnet') || model.includes('opus')) {
    return ['anthropic']
  }
  // Check if it's an OpenAI/GPT model (now uses OpenAI directly)
  if (model.includes('gpt')) {
    return ['openai']
  }
  // Fallback to both if we can't determine
  return ['openai', 'anthropic']
}

export function TaskForm({
  onSubmit,
  isSubmitting,
  initialInstallDependencies = false,
  initialMaxDuration = 300,
  initialKeepAlive = false,
  maxSandboxDuration = 300,
}: TaskFormProps) {
  const [prompt, setPrompt] = useAtom(taskPromptAtom)
  const [savedAgent, setSavedAgent] = useAtom(lastSelectedAgentAtom)
  const [selectedAgent, setSelectedAgent] = useState(savedAgent || 'ollama')
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODELS.ollama)
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [repos, setRepos] = useState<Repo[]>([]) // Removed GitHub cache functionality
  const [, setLoadingRepos] = useState(false)

  // Options state - initialize with server values
  const [installDependencies, setInstallDependenciesState] = useState(initialInstallDependencies)
  const [maxDuration, setMaxDurationState] = useState(initialMaxDuration)
  const [keepAlive, setKeepAliveState] = useState(initialKeepAlive)
  const [showMcpServersDialog, setShowMcpServersDialog] = useState(false)
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking')
  const [availableModels, setAvailableModels] = useState<string[]>([])

  // Connectors state
  const { connectors } = useConnectors()

  // Ref for the textarea to focus it programmatically
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Check Ollama status on mount
  useEffect(() => {
    const checkOllamaStatus = async () => {
      try {
        setOllamaStatus('checking')
        const response = await fetch('/api/llm/chat', { method: 'GET' })
        if (response.ok) {
          const data = await response.json()
          if (data.connected) {
            setOllamaStatus('connected')
            setAvailableModels(data.models || [])
          } else {
            setOllamaStatus('disconnected')
            setAvailableModels([])
          }
        } else {
          setOllamaStatus('error')
          setAvailableModels([])
        }
      } catch (error) {
        console.error('Error checking Ollama status:', error)
        setOllamaStatus('error')
        setAvailableModels([])
      }
    }

    checkOllamaStatus()
    // Check every 30 seconds
    const interval = setInterval(checkOllamaStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Wrapper functions to update both state and cookies
  const updateInstallDependencies = (value: boolean) => {
    setInstallDependenciesState(value)
    setInstallDependencies(value)
  }

  const updateMaxDuration = (value: number) => {
    setMaxDurationState(value)
    setMaxDuration(value)
  }

  const updateKeepAlive = (value: boolean) => {
    setKeepAliveState(value)
    setKeepAlive(value)
  }

  // Handle keyboard events in textarea
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      // On desktop: Enter submits, Shift+Enter creates new line
      // On mobile: Enter creates new line, must use submit button
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
      if (!isMobile && !e.shiftKey) {
        e.preventDefault()
        if (prompt.trim()) {
          // Find the form and submit it
          const form = e.currentTarget.closest('form')
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
          }
        }
      }
      // For all other cases (mobile Enter, desktop Shift+Enter), let default behavior create new line
    }
  }

  // Get URL search params
  const searchParams = useSearchParams()

  // Load saved agent, model, and options on mount, and focus the prompt input
  useEffect(() => {
    // Check URL params first
    const urlAgent = searchParams?.get('agent')
    const urlModel = searchParams?.get('model')

    if (
      urlAgent &&
      CODING_AGENTS.some((agent) => agent.value === urlAgent && !('isDivider' in agent && agent.isDivider))
    ) {
      setSelectedAgent(urlAgent)
      if (urlModel) {
        const agentModels = AGENT_MODELS[urlAgent as keyof typeof AGENT_MODELS]
        if (agentModels?.some((model) => model.value === urlModel)) {
          setSelectedModel(urlModel)
        }
      }
    } else if (savedAgent) {
      // Fall back to saved agent from Jotai atom
      if (CODING_AGENTS.some((agent) => agent.value === savedAgent && !('isDivider' in agent && agent.isDivider))) {
        setSelectedAgent(savedAgent)
      }
    }

    // Options are now initialized from server props, no need to load from cookies

    // Focus the prompt input when the component mounts
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Get saved model atom for current agent
  const savedModelAtom = lastSelectedModelAtomFamily(selectedAgent)
  const savedModel = useAtomValue(savedModelAtom)
  const setSavedModel = useSetAtom(savedModelAtom)

  // Update model when agent changes
  useEffect(() => {
    if (selectedAgent) {
      // Clear selectedModels when switching away from multi-agent
      if (selectedAgent !== 'multi-agent') {
        setSelectedModels([])
      }

      // Load saved model for this agent or use default
      const agentModels = AGENT_MODELS[selectedAgent as keyof typeof AGENT_MODELS]
      if (savedModel && agentModels?.some((model) => model.value === savedModel)) {
        setSelectedModel(savedModel)
      } else {
        const defaultModel = DEFAULT_MODELS[selectedAgent as keyof typeof DEFAULT_MODELS]
        if (defaultModel) {
          setSelectedModel(defaultModel)
        }
      }
    }
  }, [selectedAgent, savedModel])

  // No repository functionality since GitHub auth is removed
  useEffect(() => {
    setRepos([])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) {
      return
    }

    // Check Ollama status before submitting task
    try {
      const ollamaCheck = await fetch('/api/llm/chat', { method: 'GET' })
      if (!ollamaCheck.ok) {
        toast.error('Ollama service is not accessible', {
          description: 'Please ensure Ollama is running on http://localhost:11434',
        })
        return
      }

      let ollamaData;
      try {
        ollamaData = await ollamaCheck.json()
      } catch (parseError) {
        console.error('JSON parsing error for Ollama health check:', parseError)
        console.error('Ollama check status:', ollamaCheck.status)
        console.error('Ollama check headers:', Object.fromEntries(ollamaCheck.headers.entries()))
        
        // Try to get text response to see what's actually being returned
        const textResponse = await ollamaCheck.text()
        console.error('Ollama raw response:', textResponse.substring(0, 500)) // First 500 chars
        
        toast.error('Ollama service error: Invalid response format')
        return
      }
      
      if (!ollamaData.connected) {
        toast.error('Ollama service is not connected', {
          description: 'Please ensure Ollama is running on http://localhost:11434',
        })
        return
      }

      // Check if selected model is available
      if (
        selectedModel &&
        !ollamaData.models?.some(
          (model: string) =>
            model.toLowerCase().includes(selectedModel.toLowerCase()) ||
            selectedModel.toLowerCase().includes(model.toLowerCase()),
        )
      ) {
        toast.error(`Model '${selectedModel}' is not loaded in Ollama`, {
          description: `Available models: ${ollamaData.models?.join(', ') || 'none'}. Please load the model in Ollama first.`,
        })
        return
      }
    } catch (error) {
      console.error('Error checking Ollama status:', error)
      toast.error('Cannot connect to Ollama service', {
        description: 'Please ensure Ollama is running on http://localhost:11434',
      })
      return
    }

    // Validate that multi-agent mode has at least one model selected
    if (selectedAgent === 'multi-agent' && selectedModels.length === 0) {
      toast.error('Please select at least one model for multi-agent mode')
      return
    }

    // Check if API key is required and available for the selected agent and model
    if (selectedAgent !== 'multi-agent') {
      try {
        const response = await fetch(`/api/api-keys/check?agent=${selectedAgent}&model=${selectedModel}`)
        let data;
        try {
          data = await response.json()
        } catch (parseError) {
          console.error('JSON parsing error for API key check:', parseError)
          console.error('API key check status:', response.status)
          console.error('API key check headers:', Object.fromEntries(response.headers.entries()))
          
          // Try to get text response to see what's actually being returned
          const textResponse = await response.text()
          console.error('API key check raw response:', textResponse.substring(0, 500))
          
          // Don't show error to user, just continue (might be unauthenticated)
          throw new Error('Invalid JSON response')
        }

        if (!data.hasKey) {
          // Show error message with provider name
          const providerNames: Record<string, string> = {
            anthropic: 'Anthropic',
            openai: 'OpenAI',
            cursor: 'Cursor',
            gemini: 'Gemini',
            // aigateway: 'AI Gateway', // Removed - Vercel AI Gateway dependency,
          }
          const providerName = providerNames[data.provider] || data.provider

          toast.error(`${providerName} API key required`, {
            description: `Please add your ${providerName} API key in the user menu to use the ${data.agentName} agent with this model.`,
          })
          return
        }
      } catch (error) {
        console.error('Error checking API key:', error)
        // Don't show error toast - might just be not authenticated, let parent handle it
      }
    }

    onSubmit({
      prompt: prompt.trim(),
      selectedAgent,
      selectedModel,
      selectedModels: selectedAgent === 'multi-agent' ? selectedModels : undefined,
      installDependencies,
      maxDuration,
      keepAlive,
    })
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          SamAi0
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          Multi-agent AI coding platform powered by{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline text-primary font-medium"
          >
            Ollama
          </a>
        </p>
        {/* Ollama Status Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {ollamaStatus === 'checking' && (
            <>
              <Circle className="h-4 w-4 text-muted-foreground animate-pulse" />
              <span className="text-sm text-muted-foreground">Checking Ollama...</span>
            </>
          )}
          {ollamaStatus === 'connected' && (
            <>
              <CircleCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Ollama Connected</span>
              {selectedModel &&
                !availableModels.some(
                  (model) =>
                    model.toLowerCase().includes(selectedModel.toLowerCase()) ||
                    selectedModel.toLowerCase().includes(model.toLowerCase()),
                ) && <span className="text-sm text-muted-foreground ml-2">(Model not loaded)</span>}
            </>
          )}
          {(ollamaStatus === 'disconnected' || ollamaStatus === 'error') && (
            <>
              <CircleAlert className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Ollama Disconnected</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground underline cursor-help">(?)</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Please ensure Ollama is running on http://localhost:11434</p>
                    {availableModels.length > 0 && (
                      <p className="mt-1">Available models: {availableModels.join(', ')}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="relative border rounded-2xl shadow-lg overflow-hidden bg-gradient-to-br from-background to-muted/50 cursor-text transition-all duration-300 hover:shadow-xl">
          {/* Prompt Input */}
          <div className="relative bg-transparent">
            <Textarea
              ref={textareaRef}
              id="prompt"
              placeholder="Describe what you want the AI agent to do..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              disabled={isSubmitting}
              required
              rows={4}
              className="w-full border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-5 text-base !bg-transparent shadow-none! text-lg"
            />
            {/* Token Counter */}
            <div className="px-5 pb-3 flex justify-between items-center text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Characters: {prompt.length}</span>
                <span>•</span>
                <span>Estimated tokens: {Math.ceil(prompt.length / 4)}</span>
              </div>
              {prompt.length > 4000 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Long prompt - may be truncated</span>
                </div>
              )}
              {prompt.length > 8000 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Very long prompt - will be truncated</span>
                </div>
              )}
            </div>
          </div>

          {/* Agent Selection */}
          <div className="p-5 bg-muted/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Left side: Agent, Model, and Option Chips */}
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                {/* Agent Selection - Icon only on mobile, minimal width */}
                <div className="w-full sm:w-auto">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Agent</label>
                  <Select
                    value={selectedAgent}
                    onValueChange={(value) => {
                      setSelectedAgent(value)
                      // Save to Jotai atom immediately
                      setSavedAgent(value)
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full sm:w-auto min-w-[140px] h-10">
                      <SelectValue placeholder="Select Agent">
                        {selectedAgent &&
                          (() => {
                            const agent = CODING_AGENTS.find((a) => a.value === selectedAgent)
                            return agent ? (
                              <div className="flex items-center gap-2">
                                {agent.icon && <agent.icon className="w-4 h-4" />}
                                <span>{agent.label}</span>
                              </div>
                            ) : null
                          })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CODING_AGENTS.map((agent) => {
                        if ('isDivider' in agent && agent.isDivider) {
                          return <div key={agent.value} className="h-px bg-border my-1" />
                        }
                        return (
                          <SelectItem key={agent.value} value={agent.value}>
                            <div className="flex items-center gap-2">
                              {agent.icon && <agent.icon className="w-4 h-4" />}
                              <span>{agent.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model Selection - Fills available width on mobile */}
                <div className="w-full sm:w-auto">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Model</label>
                  {selectedAgent === 'multi-agent' ? (
                    <Select value="multi-select" onValueChange={() => {}} disabled={isSubmitting}>
                      <SelectTrigger className="w-full sm:w-auto min-w-[140px] h-10">
                        <SelectValue>
                          {selectedModels.length === 0 ? 'Select models' : `${selectedModels.length} Selected`}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>{[]}</SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={selectedModel}
                      onValueChange={(value) => {
                        setSelectedModel(value)
                        // Save to Jotai atom immediately
                        setSavedModel(value)
                      }}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-full sm:w-auto min-w-[140px] h-10">
                        <SelectValue placeholder="Select Model" className="truncate" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Show both static models and dynamically available models */}
                        {[
                          ...(AGENT_MODELS[selectedAgent as keyof typeof AGENT_MODELS] || []),
                          ...availableModels
                            .filter(model => !AGENT_MODELS[selectedAgent as keyof typeof AGENT_MODELS]?.some(m => m.value === model))
                            .map(model => ({ value: model, label: model }))
                        ].map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Option Chips - Visible on all screens */}
                <div className="flex flex-wrap items-center gap-2">
                  {!installDependencies && (
                    <Badge variant="outline" className="text-xs h-6 px-2 gap-1">
                      Skip Install
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateInstallDependencies(true)
                        }}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  )}
                  {maxDuration !== maxSandboxDuration && (
                    <Badge variant="outline" className="text-xs h-6 px-2 gap-1">
                      {maxDuration}m
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateMaxDuration(maxSandboxDuration)
                        }}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  )}
                  {keepAlive && (
                    <Badge variant="outline" className="text-xs h-6 px-2 gap-1">
                      Keep Alive
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateKeepAlive(false)
                        }}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Right side: Action Icons and Submit Button */}
              <div className="flex items-center gap-2">
                <TooltipProvider delayDuration={1500} skipDelayDuration={1500}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 px-3"
                        onClick={() => setShowMcpServersDialog(true)}
                        disabled={isSubmitting}
                      >
                        <Cable className="h-4 w-4 mr-2" />
                        MCP Servers
                        {connectors.filter((c) => c.status === 'connected').length > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-2 h-5 min-w-5 p-0 flex items-center justify-center text-[10px] rounded-full"
                          >
                            {connectors.filter((c) => c.status === 'connected').length}
                          </Badge>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Connected MCP Servers</p>
                    </TooltipContent>
                  </Tooltip>

                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10 px-3"
                            disabled={isSubmitting}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Options
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Task Options</p>
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent className="w-72" align="end">
                      <DropdownMenuLabel>Task Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="p-2 space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="install-deps"
                            checked={installDependencies}
                            onCheckedChange={(checked) => updateInstallDependencies(checked === true)}
                          />
                          <Label
                            htmlFor="install-deps"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Install Dependencies?
                          </Label>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max-duration" className="text-sm font-medium">
                            Maximum Duration
                          </Label>
                          <Select
                            value={maxDuration.toString()}
                            onValueChange={(value) => updateMaxDuration(parseInt(value))}
                          >
                            <SelectTrigger id="max-duration" className="w-full h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 minutes</SelectItem>
                              <SelectItem value="10">10 minutes</SelectItem>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="45">45 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                              <SelectItem value="180">3 hours</SelectItem>
                              <SelectItem value="240">4 hours</SelectItem>
                              <SelectItem value="300">5 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="keep-alive"
                              checked={keepAlive}
                              onCheckedChange={(checked) => updateKeepAlive(checked === true)}
                            />
                            <Label
                              htmlFor="keep-alive"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              Keep Alive (300m max)
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground pl-6">Keep running after completion.</p>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button type="submit" disabled={isSubmitting || !prompt.trim()} size="sm" className="h-10 px-4 ml-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowUp className="h-4 w-4 mr-2" />
                        Submit
                      </>
                    )}
                  </Button>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Agent Info - Hidden since we only have Ollama */}
        {false && selectedAgent === 'multi-agent' && selectedModels.length > 0 && (
          <div className="mt-3 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            This will create {selectedModels.length} separate task{selectedModels.length > 1 ? 's' : ''} (one for each
            selected model)
          </div>
        )}
      </form>

      <ConnectorDialog open={showMcpServersDialog} onOpenChange={setShowMcpServersDialog} />
    </div>
  )
}
