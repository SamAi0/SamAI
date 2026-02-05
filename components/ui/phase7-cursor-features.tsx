'use client'

import { useState, useEffect } from 'react'
import { 
  Settings,
  Brain,
  ShieldAlert,
  FolderPlus,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContextAwareAIServiceComponent, ProjectContext } from './context-aware-ai'
import { ChangeConfirmationSystem } from './change-confirmation'
import { FrameworkAwareFileCreator } from './framework-aware-file-creator'
import { cn } from '@/lib/utils'

// Main Phase 7 UI Component
interface Phase7CursorLikeFeaturesProps {
  className?: string
  projectFiles: string[]
  projectRoot: string
  availableFrameworks?: string[]
  onFileCreate?: (request: any) => Promise<boolean>
  onChangeConfirm?: (changeId: string) => void
}

export function Phase7CursorLikeFeatures({ 
  className,
  projectFiles,
  projectRoot,
  availableFrameworks = ['nextjs', 'react', 'nodejs', 'python'],
  onFileCreate,
  onChangeConfirm
}: Phase7CursorLikeFeaturesProps) {
  const [activeTab, setActiveTab] = useState<'context' | 'confirmation' | 'creator'>('context')
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null)

  // Initialize project context
  useEffect(() => {
    if (projectFiles.length > 0) {
      const context: ProjectContext = {
        relevantFiles: projectFiles,
        folderStructure: Array.from(new Set(
          projectFiles.map(file => {
            const parts = file.split('/')
            return parts.slice(0, -1).join('/')
          })
        )).filter(Boolean),
        projectRoot,
        framework: detectFrameworkFromFiles(projectFiles)
      }
      setProjectContext(context)
    }
  }, [projectFiles, projectRoot])

  // Simple framework detection
  const detectFrameworkFromFiles = (files: string[]): string | undefined => {
    const fileSet = new Set(files)
    
    if (fileSet.has('next.config.js') || fileSet.has('next.config.ts')) return 'nextjs'
    if (fileSet.has('package.json')) {
      // Check for React dependencies
      if (files.some(f => f.includes('components') || f.includes('src'))) return 'react'
    }
    if (files.some(f => f.endsWith('.py'))) return 'python'
    if (files.some(f => f.endsWith('.js') || f.endsWith('.ts'))) return 'nodejs'
    
    return undefined
  }

  // Handle context updates
  const handleContextUpdate = (context: ProjectContext) => {
    setProjectContext(context)
  }

  // Handle file creation
  const handleFileCreate = async (request: any) => {
    if (onFileCreate) {
      return await onFileCreate(request)
    }
    // Default implementation - log to console
    console.log('File creation request:', request)
    return true
  }

  // Handle change confirmation
  const handleChangeConfirm = (changeId: string) => {
    if (onChangeConfirm) {
      onChangeConfirm(changeId)
    }
    // Default implementation - log to console
    console.log('Change confirmed:', changeId)
  }

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Cursor-like Features</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {projectFiles.length} files
            </Badge>
            {projectContext?.framework && (
              <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                {projectContext.framework}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Intelligent context management and safety controls
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('context')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'context'
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <Brain className="w-4 h-4" />
          Context Control
        </button>
        <button
          onClick={() => setActiveTab('confirmation')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'confirmation'
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <ShieldAlert className="w-4 h-4" />
          Change Safety
        </button>
        <button
          onClick={() => setActiveTab('creator')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'creator'
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <FolderPlus className="w-4 h-4" />
          File Creator
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'context' && projectContext && (
          <div className="max-w-4xl">
            <ContextAwareAIServiceComponent
              projectContext={projectContext}
              onContextUpdate={handleContextUpdate}
            />
            
            {/* Context Info Panel */}
            <div className="mt-6 p-4 bg-white rounded-lg border">
              <h3 className="font-medium text-gray-900 mb-3">Current Context Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Framework:</span>
                  <div className="font-medium mt-1">
                    {projectContext.framework || 'Not detected'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Files in Context:</span>
                  <div className="font-medium mt-1">
                    {projectContext.relevantFiles.length}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Folder Depth:</span>
                  <div className="font-medium mt-1">
                    {projectContext.folderStructure.length > 0 
                      ? Math.max(...projectContext.folderStructure.map(f => f.split('/').length))
                      : 0
                    }
                  </div>
                </div>
              </div>
              
              {projectContext.relevantFiles.length > 0 && (
                <div className="mt-4">
                  <span className="text-gray-500 text-sm">Sample relevant files:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {projectContext.relevantFiles.slice(0, 5).map((file, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {file}
                      </Badge>
                    ))}
                    {projectContext.relevantFiles.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{projectContext.relevantFiles.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'confirmation' && (
          <div className="max-w-4xl">
            <ChangeConfirmationSystem
              onChangeConfirm={handleChangeConfirm}
            />
            
            {/* Safety Guidelines */}
            <div className="mt-6 p-4 bg-white rounded-lg border">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Safety Guidelines
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Changes affecting multiple files require explicit confirmation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Folder deletions must be manually approved</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Project-wide refactoring requires careful review</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>Always backup your project before major changes</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'creator' && (
          <div className="max-w-4xl">
            <FrameworkAwareFileCreator
              availableFrameworks={availableFrameworks}
              onFileCreate={handleFileCreate}
            />
            
            {/* Framework Guidelines */}
            <div className="mt-6 p-4 bg-white rounded-lg border">
              <h3 className="font-medium text-gray-900 mb-3">Framework Guidelines</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Next.js:</span>
                  <ul className="mt-1 ml-4 space-y-1">
                    <li>• Components in /components/ui/</li>
                    <li>• Pages in /app/ directory</li>
                    <li>• API routes in /app/api/</li>
                  </ul>
                </div>
                <div>
                  <span className="font-medium">React:</span>
                  <ul className="mt-1 ml-4 space-y-1">
                    <li>• Components in /src/components/</li>
                    <li>• Hooks in /src/hooks/</li>
                    <li>• Utilities in /src/utils/</li>
                  </ul>
                </div>
                <div>
                  <span className="font-medium">Node.js:</span>
                  <ul className="mt-1 ml-4 space-y-1">
                    <li>• Routes in /src/routes/</li>
                    <li>• Controllers in /src/controllers/</li>
                    <li>• Middleware in /src/middleware/</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Export the component
export default Phase7CursorLikeFeatures