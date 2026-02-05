'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Brain,
  FolderTree,
  FileText,
  Settings,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Types
interface ProjectContext {
  relevantFiles: string[]
  folderStructure: string[]
  projectRoot: string
  framework?: string
  language?: string
}

interface ContextSettings {
  maxFiles: number
  includeTests: boolean
  includeDocs: boolean
  depthLimit: number
  autoDetectFramework: boolean
}

interface ContextAwareAIServiceProps {
  projectContext: ProjectContext
  onContextUpdate: (context: ProjectContext) => void
  className?: string
}

// Framework detection heuristics
const FRAMEWORK_HEURISTICS = {
  nextjs: {
    files: ['next.config.js', 'next.config.ts', 'package.json'],
    folders: ['pages', 'app', 'public'],
    dependencies: ['next']
  },
  react: {
    files: ['package.json'],
    folders: ['src', 'components'],
    dependencies: ['react', 'react-dom']
  },
  nodejs: {
    files: ['package.json', 'server.js', 'index.js'],
    folders: ['src', 'lib', 'routes'],
    dependencies: ['express', 'koa', 'fastify']
  },
  python: {
    files: ['requirements.txt', 'setup.py', 'pyproject.toml'],
    folders: ['src', 'tests', 'venv'],
    extensions: ['.py']
  }
} as const

// Context-aware AI Service
class ContextAwareAIService {
  private static instance: ContextAwareAIService
  private projectContext: ProjectContext | null = null
  private settings: ContextSettings = {
    maxFiles: 10,
    includeTests: false,
    includeDocs: false,
    depthLimit: 3,
    autoDetectFramework: true
  }

  private constructor() {}

  static getInstance(): ContextAwareAIService {
    if (!ContextAwareAIService.instance) {
      ContextAwareAIService.instance = new ContextAwareAIService()
    }
    return ContextAwareAIService.instance
  }

  setProjectContext(context: ProjectContext) {
    this.projectContext = context
  }

  getProjectContext(): ProjectContext | null {
    return this.projectContext
  }

  updateSettings(newSettings: Partial<ContextSettings>) {
    this.settings = { ...this.settings, ...newSettings }
  }

  getSettings(): ContextSettings {
    return this.settings
  }

  // Detect project framework based on file structure
  detectFramework(files: string[]): string | null {
    const fileSet = new Set(files)
    
    for (const [framework, rules] of Object.entries(FRAMEWORK_HEURISTICS)) {
      const fileMatches = rules.files.filter(file => fileSet.has(file)).length
      const folderMatches = rules.folders.filter(folder => 
        files.some(f => f.includes(folder))
      ).length
      
      // If we have significant matches, return the framework
      if (fileMatches >= 1 || folderMatches >= 2) {
        return framework
      }
    }
    
    return null
  }

  // Generate intelligent context for AI
  generateContext(prompt: string, availableFiles: string[]): ProjectContext {
    if (!this.projectContext) {
      throw new Error('Project context not initialized')
    }

    // Analyze prompt to determine relevant files
    const relevantFiles = this.findRelevantFiles(prompt, availableFiles)
    
    // Generate folder structure representation
    const folderStructure = this.generateFolderStructure(availableFiles)
    
    // Detect framework if auto-detection is enabled
    let framework = this.projectContext.framework
    if (this.settings.autoDetectFramework) {
      framework = this.detectFramework(availableFiles) || framework
    }

    const context: ProjectContext = {
      relevantFiles: relevantFiles.slice(0, this.settings.maxFiles),
      folderStructure,
      projectRoot: this.projectContext.projectRoot,
      framework,
      language: this.detectLanguage(relevantFiles)
    }

    return context
  }

  // Find files relevant to the prompt
  private findRelevantFiles(prompt: string, availableFiles: string[]): string[] {
    const keywords = this.extractKeywords(prompt)
    const scoredFiles: Array<{ file: string; score: number }> = []

    for (const file of availableFiles) {
      let score = 0
      
      // Score based on keyword matches
      for (const keyword of keywords) {
        if (file.toLowerCase().includes(keyword.toLowerCase())) {
          score += 10
        }
      }
      
      // Boost score for common project files
      if (file === 'package.json' || file === 'tsconfig.json' || file === 'README.md') {
        score += 5
      }
      
      // Penalize test and documentation files unless explicitly included
      if (!this.settings.includeTests && (file.includes('test') || file.includes('spec'))) {
        score -= 20
      }
      
      if (!this.settings.includeDocs && (file.includes('docs') || file.includes('README'))) {
        score -= 15
      }
      
      if (score > 0) {
        scoredFiles.push({ file, score })
      }
    }

    // Sort by relevance score and return top matches
    return scoredFiles
      .sort((a, b) => b.score - a.score)
      .map(item => item.file)
  }

  // Extract keywords from prompt
  private extractKeywords(prompt: string): string[] {
    // Remove common words and extract meaningful terms
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'create', 'make', 'add', 'update', 'change', 'modify', 'fix', 'implement'
    ])
    
    return prompt
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10) // Limit to top 10 keywords
  }

  // Generate folder structure representation
  private generateFolderStructure(files: string[]): string[] {
    const folders = new Set<string>()
    
    for (const file of files) {
      const parts = file.split('/')
      let currentPath = ''
      
      for (let i = 0; i < Math.min(parts.length - 1, this.settings.depthLimit); i++) {
        currentPath += (currentPath ? '/' : '') + parts[i]
        folders.add(currentPath)
      }
    }
    
    return Array.from(folders).sort()
  }

  // Detect primary language from files
  private detectLanguage(files: string[]): string | undefined {
    const extensions = files.map(file => {
      const parts = file.split('.')
      return parts.length > 1 ? parts[parts.length - 1] : ''
    })
    
    const extensionCounts: Record<string, number> = {}
    extensions.forEach(ext => {
      if (ext) extensionCounts[ext] = (extensionCounts[ext] || 0) + 1
    })
    
    const mostCommon = Object.entries(extensionCounts)
      .sort(([,a], [,b]) => b - a)[0]
    
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'cpp': 'cpp',
      'c': 'c'
    }
    
    return mostCommon ? languageMap[mostCommon[0]] : undefined
  }

  // Check if proposed change is "big" and requires confirmation
  isBigChange(changePlan: ChangePlan): boolean {
    return (
      changePlan.deletedFolders.length > 0 ||
      changePlan.modifiedFiles.length > 5 ||
      changePlan.fileOperations.some(op => op.type === 'refactor' && op.scope === 'project-wide')
    )
  }
}

// Change plan interface for confirmation system
interface ChangePlan {
  title: string
  description: string
  modifiedFiles: string[]
  deletedFolders: string[]
  fileOperations: Array<{
    type: 'create' | 'modify' | 'delete' | 'refactor'
    filePath: string
    scope: 'file' | 'folder' | 'project-wide'
  }>
  estimatedImpact: 'low' | 'medium' | 'high'
}

// Main Context Control Component
export function ContextAwareAIServiceComponent({ 
  projectContext,
  onContextUpdate,
  className
}: ContextAwareAIServiceProps) {
  const [service] = useState(() => ContextAwareAIService.getInstance())
  const [settings, setSettings] = useState<ContextSettings>(service.getSettings())
  const [detectedFramework, setDetectedFramework] = useState<string | null>(null)

  // Initialize service with project context
  useEffect(() => {
    if (projectContext) {
      service.setProjectContext(projectContext)
      if (settings.autoDetectFramework) {
        const framework = service.detectFramework(projectContext.relevantFiles)
        setDetectedFramework(framework)
      }
    }
  }, [projectContext, service, settings.autoDetectFramework])

  // Handle settings changes
  const handleSettingChange = useCallback((key: keyof ContextSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    service.updateSettings(newSettings)
  }, [settings, service])

  // Generate context for a prompt
  const generateContextForPrompt = useCallback((prompt: string) => {
    if (!projectContext) return null
    
    try {
      return service.generateContext(prompt, projectContext.relevantFiles)
    } catch (error) {
      console.error('Failed to generate context:', error)
      return null
    }
  }, [projectContext, service])

  // Framework display names
  const getFrameworkDisplayName = (framework: string | null): string => {
    const names: Record<string, string> = {
      nextjs: 'Next.js',
      react: 'React',
      nodejs: 'Node.js',
      python: 'Python'
    }
    return framework ? names[framework] || framework : 'Unknown'
  }

  return (
    <div className={cn("p-4 bg-white rounded-lg border", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Context Control</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {detectedFramework ? getFrameworkDisplayName(detectedFramework) : 'Analyzing...'}
        </Badge>
      </div>

      {/* Context Settings */}
      <div className="space-y-4">
        {/* File Limit */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="max-files" className="text-sm font-medium">
              Max Context Files
            </Label>
            <p className="text-xs text-gray-500">
              Limit files sent to AI context
            </p>
          </div>
          <select
            id="max-files"
            value={settings.maxFiles}
            onChange={(e) => handleSettingChange('maxFiles', parseInt(e.target.value))}
            className="text-sm border rounded px-2 py-1"
          >
            <option value={5}>5 files</option>
            <option value={10}>10 files</option>
            <option value={15}>15 files</option>
            <option value={20}>20 files</option>
          </select>
        </div>

        {/* Include Tests */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Include Test Files</Label>
            <p className="text-xs text-gray-500">
              Send test files to AI context
            </p>
          </div>
          <Switch
            checked={settings.includeTests}
            onCheckedChange={(checked) => handleSettingChange('includeTests', checked)}
          />
        </div>

        {/* Include Documentation */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Include Documentation</Label>
            <p className="text-xs text-gray-500">
              Send README and docs to AI
            </p>
          </div>
          <Switch
            checked={settings.includeDocs}
            onCheckedChange={(checked) => handleSettingChange('includeDocs', checked)}
          />
        </div>

        {/* Auto-detect Framework */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Auto-detect Framework</Label>
            <p className="text-xs text-gray-500">
              Automatically detect project type
            </p>
          </div>
          <Switch
            checked={settings.autoDetectFramework}
            onCheckedChange={(checked) => handleSettingChange('autoDetectFramework', checked)}
          />
        </div>

        {/* Current Context Info */}
        {projectContext && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Current Context</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Files in context:</span>
                <span>{projectContext.relevantFiles.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Folder depth:</span>
                <span>{settings.depthLimit}</span>
              </div>
              <div className="flex justify-between">
                <span>Framework:</span>
                <span className="font-medium">
                  {getFrameworkDisplayName(detectedFramework || projectContext.framework || null)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for using context-aware AI service
export function useContextAwareAI() {
  const [service] = useState(() => ContextAwareAIService.getInstance())
  
  const generateContext = useCallback((prompt: string, availableFiles: string[]) => {
    return service.generateContext(prompt, availableFiles)
  }, [service])

  const isBigChange = useCallback((changePlan: ChangePlan) => {
    return service.isBigChange(changePlan)
  }, [service])

  const getSettings = useCallback(() => {
    return service.getSettings()
  }, [service])

  return {
    generateContext,
    isBigChange,
    getSettings,
    service
  }
}

// Export types and service
export type { ProjectContext, ContextSettings, ChangePlan }
export { ContextAwareAIService }