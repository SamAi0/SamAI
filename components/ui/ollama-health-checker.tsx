'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  WifiOff,
  Server
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

// Types
interface OllamaHealthStatus {
  isHealthy: boolean
  version?: string
  models?: string[]
  errorMessage?: string
  lastChecked: Date
  responseTime?: number
}

interface OllamaHealthCheckerProps {
  ollamaUrl?: string
  checkInterval?: number // milliseconds
  onStatusChange?: (status: OllamaHealthStatus) => void
  className?: string
}

// Constants
const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434'
const DEFAULT_CHECK_INTERVAL = 30000 // 30 seconds

// Health check service
class OllamaHealthService {
  private static instance: OllamaHealthService
  private url: string
  private listeners: Array<(status: OllamaHealthStatus) => void> = []
  private currentStatus: OllamaHealthStatus = {
    isHealthy: false,
    lastChecked: new Date(0)
  }
  private checkIntervalId: NodeJS.Timeout | null = null
  private manualCheckPromise: Promise<OllamaHealthStatus> | null = null

  private constructor(url: string = DEFAULT_OLLAMA_URL) {
    this.url = url
  }

  static getInstance(url?: string): OllamaHealthService {
    if (!OllamaHealthService.instance) {
      OllamaHealthService.instance = new OllamaHealthService(url)
    }
    return OllamaHealthService.instance
  }

  subscribe(listener: (status: OllamaHealthStatus) => void): () => void {
    this.listeners.push(listener)
    // Send current status immediately
    listener(this.currentStatus)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  getCurrentStatus(): OllamaHealthStatus {
    return this.currentStatus
  }

  async checkHealth(force: boolean = false): Promise<OllamaHealthStatus> {
    // If there's already a check in progress, return that promise
    if (!force && this.manualCheckPromise) {
      return this.manualCheckPromise
    }

    const startTime = Date.now()
    
    this.manualCheckPromise = this.performHealthCheck()
      .then(status => {
        const endTime = Date.now()
        status.responseTime = endTime - startTime
        this.updateStatus(status)
        this.manualCheckPromise = null
        return status
      })
      .catch(error => {
        const status: OllamaHealthStatus = {
          isHealthy: false,
          errorMessage: error.message || 'Health check failed',
          lastChecked: new Date()
        }
        this.updateStatus(status)
        this.manualCheckPromise = null
        return status
      })

    return this.manualCheckPromise
  }

  private async performHealthCheck(): Promise<OllamaHealthStatus> {
    try {
      // Check if Ollama is running by pinging the API
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(`${this.url}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Ollama API returned status ${response.status}`)
      }

      const data = await response.json()
      
      // Extract model information
      const models = data.models?.map((model: any) => model.name) || []
      
      // Try to get version info
      let version: string | undefined
      try {
        const versionResponse = await fetch(`${this.url}/api/version`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        })
        
        if (versionResponse.ok) {
          const versionData = await versionResponse.json()
          version = versionData.version
        }
      } catch (versionError) {
        // Version check failed, but main health check succeeded
        console.debug('Could not fetch Ollama version:', versionError)
      }

      return {
        isHealthy: true,
        version,
        models,
        lastChecked: new Date()
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Ollama health check timed out')
      }
      
      // Check if it's a connection error
      if (error.message?.includes('fetch') || error.message?.includes('ECONNREFUSED')) {
        throw new Error('Cannot connect to Ollama. Make sure it is running on port 11434.')
      }
      
      throw error
    }
  }

  private updateStatus(status: OllamaHealthStatus) {
    this.currentStatus = status
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus)
      } catch (error) {
        console.error('Error notifying health status listener:', error)
      }
    })
  }

  startPeriodicChecks(interval: number = DEFAULT_CHECK_INTERVAL) {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId)
    }

    this.checkIntervalId = setInterval(() => {
      this.checkHealth().catch(console.error)
    }, interval)

    // Run initial check
    this.checkHealth().catch(console.error)
  }

  stopPeriodicChecks() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId)
      this.checkIntervalId = null
    }
  }
}

// Main Health Checker Component
export function OllamaHealthChecker({ 
  ollamaUrl = DEFAULT_OLLAMA_URL,
  checkInterval = DEFAULT_CHECK_INTERVAL,
  onStatusChange,
  className
}: OllamaHealthCheckerProps) {
  const [status, setStatus] = useState<OllamaHealthStatus>({
    isHealthy: false,
    lastChecked: new Date(0)
  })
  const [isChecking, setIsChecking] = useState(false)

  // Initialize health service
  const healthService = useCallback(() => {
    return OllamaHealthService.getInstance(ollamaUrl)
  }, [ollamaUrl])

  // Setup subscription and periodic checks
  useEffect(() => {
    const service = healthService()
    const unsubscribe = service.subscribe((newStatus) => {
      setStatus(newStatus)
      onStatusChange?.(newStatus)
    })

    service.startPeriodicChecks(checkInterval)

    return () => {
      unsubscribe()
      service.stopPeriodicChecks()
    }
  }, [healthService, checkInterval, onStatusChange])

  // Manual health check
  const handleManualCheck = async () => {
    setIsChecking(true)
    try {
      const service = healthService()
      await service.checkHealth(true)
    } finally {
      setIsChecking(false)
    }
  }

  // Format last checked time
  const formatLastChecked = (date: Date): string => {
    if (date.getTime() === 0) return 'Never'
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)

    if (diffSeconds < 60) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleTimeString()
  }

  return (
    <div className={cn("p-4 bg-white rounded-lg border", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Ollama Status</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {status.isHealthy ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualCheck}
            disabled={isChecking}
            className="h-8 px-2"
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Check'
            )}
          </Button>
        </div>
      </div>

      {/* Status Display */}
      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Connection</span>
          <span className={cn(
            "text-sm font-medium px-2 py-1 rounded",
            status.isHealthy 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          )}>
            {status.isHealthy ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Version Info */}
        {status.version && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Version</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {status.version}
            </span>
          </div>
        )}

        {/* Models Count */}
        {status.models && status.models.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Models Available</span>
            <span className="text-sm font-medium">
              {status.models.length}
            </span>
          </div>
        )}

        {/* Last Checked */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Last Checked</span>
          <span className="text-sm text-gray-500">
            {formatLastChecked(status.lastChecked)}
          </span>
        </div>

        {/* Response Time */}
        {status.responseTime !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Response Time</span>
            <span className={cn(
              "text-sm font-mono",
              status.responseTime < 1000 ? "text-green-600" : "text-yellow-600"
            )}>
              {status.responseTime}ms
            </span>
          </div>
        )}

        {/* Error Message */}
        {status.errorMessage && (
          <Alert variant="destructive" className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {status.errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Info */}
        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500">
            Connecting to: {ollamaUrl}
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for using Ollama health in components
export function useOllamaHealth(ollamaUrl?: string) {
  const [status, setStatus] = useState<OllamaHealthStatus>({
    isHealthy: false,
    lastChecked: new Date(0)
  })

  const healthService = useCallback(() => {
    return OllamaHealthService.getInstance(ollamaUrl)
  }, [ollamaUrl])

  useEffect(() => {
    const service = healthService()
    const unsubscribe = service.subscribe(setStatus)
    return unsubscribe
  }, [healthService])

  const checkHealth = useCallback(async () => {
    const service = healthService()
    return service.checkHealth(true)
  }, [healthService])

  return {
    status,
    isHealthy: status.isHealthy,
    checkHealth,
    getCurrentStatus: () => healthService().getCurrentStatus()
  }
}

// Export the service class and types
export { OllamaHealthService }
export type { OllamaHealthStatus }