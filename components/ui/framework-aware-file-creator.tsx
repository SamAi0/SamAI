'use client'

import { useState, useCallback } from 'react'
import { 
  FolderPlus,
  FilePlus,
  Settings,
  Wrench,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

// Types
interface FrameworkConfig {
  name: string
  fileExtensions: string[]
  folderStructure: Record<string, string[]>
  conventions: {
    componentNaming: 'PascalCase' | 'camelCase' | 'kebab-case' | 'snake_case'
    fileNaming: 'PascalCase' | 'camelCase' | 'kebab-case' | 'snake_case'
    testSuffix: string
    storybook?: boolean
  }
  defaultImports: string[]
}

interface FileCreationRequest {
  fileName: string
  fileType: 'component' | 'page' | 'api' | 'utility' | 'test' | 'config'
  framework: string
  location?: string
  content?: string
}

interface FrameworkAwareFileCreatorProps {
  availableFrameworks: string[]
  onFileCreate: (request: FileCreationRequest) => Promise<boolean>
  className?: string
}

// Framework configurations
const FRAMEWORK_CONFIGS: Record<string, FrameworkConfig> = {
  nextjs: {
    name: 'Next.js',
    fileExtensions: ['.tsx', '.ts', '.js', '.jsx'],
    folderStructure: {
      'app': ['page.tsx', 'layout.tsx', 'loading.tsx', 'error.tsx'],
      'components': ['Button.tsx', 'Card.tsx', 'Header.tsx'],
      'lib': ['utils.ts', 'api.ts', 'types.ts'],
      'styles': ['globals.css', 'components.css']
    },
    conventions: {
      componentNaming: 'PascalCase',
      fileNaming: 'kebab-case',
      testSuffix: '.test.tsx'
    },
    defaultImports: [
      "import React from 'react'",
      "import { Button } from '@/components/ui/button'"
    ]
  },
  react: {
    name: 'React',
    fileExtensions: ['.tsx', '.ts', '.js', '.jsx'],
    folderStructure: {
      'src': ['App.tsx', 'index.tsx'],
      'src/components': ['Button.tsx', 'Header.tsx'],
      'src/hooks': ['useAuth.ts', 'useApi.ts'],
      'src/utils': ['helpers.ts', 'constants.ts']
    },
    conventions: {
      componentNaming: 'PascalCase',
      fileNaming: 'PascalCase',
      testSuffix: '.test.tsx'
    },
    defaultImports: [
      "import React from 'react'"
    ]
  },
  nodejs: {
    name: 'Node.js',
    fileExtensions: ['.js', '.ts'],
    folderStructure: {
      'src': ['index.ts', 'server.ts'],
      'src/routes': ['users.ts', 'auth.ts'],
      'src/controllers': ['userController.ts'],
      'src/middleware': ['auth.ts', 'errorHandler.ts']
    },
    conventions: {
      componentNaming: 'camelCase',
      fileNaming: 'camelCase',
      testSuffix: '.test.ts'
    },
    defaultImports: [
      "import express from 'express'",
      "import { Request, Response } from 'express'"
    ]
  },
  python: {
    name: 'Python',
    fileExtensions: ['.py'],
    folderStructure: {
      'src': ['__init__.py', 'main.py'],
      'src/models': ['user.py', '__init__.py'],
      'src/views': ['user_views.py', '__init__.py'],
      'src/utils': ['helpers.py', '__init__.py']
    },
    conventions: {
      componentNaming: 'snake_case',
      fileNaming: 'snake_case',
      testSuffix: '_test.py'
    },
    defaultImports: [
      "from typing import List, Dict, Optional",
      "import os"
    ]
  }
}

// File templates
const FILE_TEMPLATES: Record<string, Record<string, string>> = {
  nextjs: {
    component: `import React from 'react'

interface [ComponentName]Props {
  // Add your props here
}

export function [ComponentName]({}: [ComponentName]Props) {
  return (
    <div className="[component-name]">
      {/* Your component content */}
    </div>
  )
}`,
    page: `import React from 'react'

export default function [PageName]() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">[PageName]</h1>
      {/* Your page content */}
    </div>
  )
}`,
    api: `import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Your API logic here
    return NextResponse.json({ message: 'Success' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}`
  },
  react: {
    component: `import React from 'react'

interface [ComponentName]Props {
  // Add your props here
}

export const [ComponentName]: React.FC<[ComponentName]Props> = ({}) => {
  return (
    <div className="[component-name]">
      {/* Your component content */}
    </div>
  )
}`,
    hook: `import { useState, useEffect } from 'react'

export function use[HookName]() {
  // Your hook logic here
  
  return {
    // Return hook values
  }
}`
  }
}

// Main Framework Aware File Creator Component
export function FrameworkAwareFileCreator({ 
  availableFrameworks,
  onFileCreate,
  className
}: FrameworkAwareFileCreatorProps) {
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState<FileCreationRequest['fileType']>('component')
  const [framework, setFramework] = useState('')
  const [location, setLocation] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get framework config
  const frameworkConfig = framework ? FRAMEWORK_CONFIGS[framework] : null

  // Generate file content based on framework and type
  const generateFileContent = useCallback((fileName: string): string => {
    if (!frameworkConfig) return ''
    
    const template = FILE_TEMPLATES[framework]?.[fileType]
    if (!template) return ''
    
    // Apply naming conventions
    let componentName = fileName
    let fileNameKebab = fileName
    
    switch (frameworkConfig.conventions.componentNaming) {
      case 'PascalCase':
        componentName = fileName.charAt(0).toUpperCase() + fileName.slice(1)
        break
      case 'camelCase':
        componentName = fileName.charAt(0).toLowerCase() + fileName.slice(1)
        break
      case 'kebab-case':
        fileNameKebab = fileName.toLowerCase().replace(/ /g, '-')
        break
    }
    
    return template
      .replace(/\[ComponentName\]/g, componentName)
      .replace(/\[component-name\]/g, fileNameKebab)
      .replace(/\[PageName\]/g, componentName)
      .replace(/\[HookName\]/g, componentName)
  }, [frameworkConfig, fileType, framework])

  // Handle file creation
  const handleCreateFile = async () => {
    if (!fileName.trim() || !framework) {
      setError('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const fileContent = generateFileContent(fileName)
      
      const request: FileCreationRequest = {
        fileName: fileName.trim(),
        fileType,
        framework,
        location: location.trim() || undefined,
        content: fileContent
      }

      const success = await onFileCreate(request)
      
      if (success) {
        // Reset form on success
        setFileName('')
        setLocation('')
        setError(null)
      } else {
        setError('Failed to create file')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  // Get suggested locations based on file type and framework
  const getSuggestedLocations = (): string[] => {
    if (!frameworkConfig) return []
    
    const suggestions: Record<string, string[]> = {
      component: Object.keys(frameworkConfig.folderStructure).filter(key => key.includes('component')),
      page: framework === 'nextjs' ? ['app'] : ['src/pages'],
      api: framework === 'nextjs' ? ['app/api'] : ['src/routes'],
      utility: ['src/utils', 'lib'],
      test: ['__tests__', 'tests', 'src/__tests__'],
      config: ['config', 'src/config']
    }
    
    return suggestions[fileType] || []
  }

  return (
    <div className={cn("p-4 bg-white rounded-lg border", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FolderPlus className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">File Creator</h3>
        </div>
        {frameworkConfig && (
          <Badge variant="secondary" className="text-xs">
            {frameworkConfig.name} Mode
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {/* Framework Selection */}
        <div>
          <Label htmlFor="framework" className="text-sm font-medium">
            Framework *
          </Label>
          <Select value={framework} onValueChange={setFramework}>
            <SelectTrigger>
              <SelectValue placeholder="Select framework" />
            </SelectTrigger>
            <SelectContent>
              {availableFrameworks.map(fw => (
                <SelectItem key={fw} value={fw}>
                  {FRAMEWORK_CONFIGS[fw]?.name || fw}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Type */}
        <div>
          <Label htmlFor="file-type" className="text-sm font-medium">
            File Type *
          </Label>
          <Select value={fileType} onValueChange={(value: any) => setFileType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="component">Component</SelectItem>
              <SelectItem value="page">Page</SelectItem>
              <SelectItem value="api">API Route</SelectItem>
              <SelectItem value="utility">Utility</SelectItem>
              <SelectItem value="test">Test File</SelectItem>
              <SelectItem value="config">Config File</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* File Name */}
        <div>
          <Label htmlFor="file-name" className="text-sm font-medium">
            File Name *
          </Label>
          <Input
            id="file-name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter file name"
            className="mt-1"
          />
          {frameworkConfig && (
            <p className="text-xs text-gray-500 mt-1">
              Will create: {fileName}{frameworkConfig.fileExtensions[0] || '.ts'}
            </p>
          )}
        </div>

        {/* Location */}
        <div>
          <Label htmlFor="location" className="text-sm font-medium">
            Location
          </Label>
          <div className="mt-1 space-y-2">
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., src/components/ui"
            />
            {getSuggestedLocations().length > 0 && (
              <div className="flex flex-wrap gap-1">
                {getSuggestedLocations().map(suggestion => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => setLocation(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Preview */}
        {fileName && frameworkConfig && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>File: {fileName}{frameworkConfig.fileExtensions[0]}</div>
              <div>Location: {location || '(root)'}</div>
              <div>Framework: {frameworkConfig.name}</div>
              <div>Type: {fileType}</div>
            </div>
          </div>
        )}

        {/* Create Button */}
        <Button
          onClick={handleCreateFile}
          disabled={!fileName.trim() || !framework || isCreating}
          className="w-full"
        >
          {isCreating ? 'Creating...' : 'Create File'}
        </Button>
      </div>
    </div>
  )
}

// Hook for framework-aware file creation
export function useFrameworkAwareFileCreation() {
  const [recentCreations, setRecentCreations] = useState<FileCreationRequest[]>([])

  const createFile = useCallback(async (request: FileCreationRequest): Promise<boolean> => {
    try {
      // In a real implementation, this would call the actual file creation API
      console.log('Creating file:', request)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Add to recent creations
      setRecentCreations(prev => [request, ...prev.slice(0, 9)])
      
      return true
    } catch (error) {
      console.error('Failed to create file:', error)
      return false
    }
  }, [])

  const getFrameworkSuggestions = useCallback((framework: string): string[] => {
    const config = FRAMEWORK_CONFIGS[framework]
    return config ? Object.keys(config.folderStructure) : []
  }, [])

  return {
    createFile,
    recentCreations,
    getFrameworkSuggestions
  }
}

// Export types and configs
export type { FrameworkConfig, FileCreationRequest }
export { FRAMEWORK_CONFIGS, FILE_TEMPLATES }