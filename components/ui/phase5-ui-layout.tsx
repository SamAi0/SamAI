'use client'

import { useState, useEffect } from 'react'
import { ProjectTree, FileNode } from './project-tree'
import { FileEditor, FileContent } from './file-editor'
import { StableChatCommandCenter, ChatMessage, ActionPlan } from './stable-chat-command-center'
import { 
  PanelLeft, 
  PanelRight, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  Settings,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

// Main UI Layout Types
interface Phase6UILayoutProps {
  className?: string
  initialFiles?: FileNode[]
  initialMessages?: ChatMessage[]
  ollamaUrl?: string
}

// Layout configuration
interface LayoutConfig {
  showLeftPanel: boolean
  showRightPanel: boolean
  leftPanelWidth: number // percentage
  rightPanelWidth: number // percentage
  isMaximized: boolean
}

// Main Component
export function Phase6UILayout({ 
  className,
  initialFiles = [],
  initialMessages = [],
  ollamaUrl = 'http://127.0.0.1:11434'
}: Phase6UILayoutProps) {
  // State management
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    showLeftPanel: true,
    showRightPanel: true,
    leftPanelWidth: 25,
    rightPanelWidth: 30,
    isMaximized: false
  })
  
  const [files, setFiles] = useState<FileNode[]>(initialFiles)
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [fileContent, setFileContent] = useState<FileContent | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize with demo data if none provided
  useEffect(() => {
    if (files.length === 0) {
      setFiles([
        {
          id: '1',
          name: 'src',
          path: 'src',
          type: 'directory',
          status: 'unchanged',
          isExpanded: true,
          children: [
            {
              id: '2',
              name: 'components',
              path: 'src/components',
              type: 'directory',
              status: 'unchanged',
              isExpanded: true,
              children: [
                {
                  id: '3',
                  name: 'Button.tsx',
                  path: 'src/components/Button.tsx',
                  type: 'file',
                  status: 'modified'
                },
                {
                  id: '4',
                  name: 'Header.tsx',
                  path: 'src/components/Header.tsx',
                  type: 'file',
                  status: 'new'
                }
              ]
            },
            {
              id: '5',
              name: 'App.tsx',
              path: 'src/App.tsx',
              type: 'file',
              status: 'modified'
            }
          ]
        },
        {
          id: '6',
          name: 'README.md',
          path: 'README.md',
          type: 'file',
          status: 'unchanged'
        },
        {
          id: '7',
          name: 'package.json',
          path: 'package.json',
          type: 'file',
          status: 'deleted'
        }
      ])
    }
  }, [])

  // File selection handler
  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file)
      
      // Simulate loading file content
      const mockContent = getMockFileContent(file.path)
      setFileContent({
        path: file.path,
        content: mockContent,
        originalContent: file.status !== 'new' ? mockContent : undefined,
        isReadOnly: file.status === 'unchanged' || file.status === 'deleted'
      })
    }
  }

  // File content change handler
  const handleFileChange = (content: string) => {
    if (fileContent) {
      setFileContent({ ...fileContent, content })
    }
  }

  // Save file handler
  const handleFileSave = (content: string) => {
    console.log('Saving file:', fileContent?.path)
    // In real implementation, this would call API to save file
  }

  // Accept file changes handler
  const handleFileAccept = () => {
    if (selectedFile && fileContent) {
      // Update file status in tree
      const updatedFiles = updateFileStatus(files, selectedFile.path, 'unchanged')
      setFiles(updatedFiles)
      setSelectedFile({ ...selectedFile, status: 'unchanged' })
      setFileContent({ ...fileContent, isReadOnly: true })
    }
  }

  // Reject file changes handler
  const handleFileReject = () => {
    if (selectedFile && fileContent?.originalContent) {
      // Revert to original content
      setFileContent({
        ...fileContent,
        content: fileContent.originalContent,
        isReadOnly: true
      })
    }
  }

  // Chat message handler
  const handleSendMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, newMessage])
    setIsLoading(true)
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you want to "${content}". Here's my analysis:`,
        timestamp: new Date(),
        actionPlan: {
          title: "Implement user authentication",
          description: "Add JWT-based authentication with login/logout functionality",
          consequences: [
            "Will modify existing user context",
            "Requires environment variable setup",
            "May affect current session management"
          ],
          filesAffected: [
            "src/context/auth.tsx",
            "src/components/LoginForm.tsx", 
            "src/api/auth.ts"
          ],
          confidence: 0.85,
          estimatedTime: "15-20 minutes"
        }
      }
      
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }

  // Execute action plan handler
  const handleExecutePlan = (plan: ActionPlan) => {
    console.log('Executing plan:', plan.title)
    // In real implementation, this would trigger the actual file operations
  }

  // Reject action plan handler
  const handleRejectPlan = (plan: ActionPlan) => {
    console.log('Rejecting plan:', plan.title)
    // In real implementation, this would dismiss the plan
  }

  // Refresh files handler
  const handleRefreshFiles = () => {
    console.log('Refreshing file tree')
    // In real implementation, this would fetch updated file list
  }

  // Layout toggle handlers
  const toggleLeftPanel = () => {
    setLayoutConfig(prev => ({
      ...prev,
      showLeftPanel: !prev.showLeftPanel
    }))
  }

  const toggleRightPanel = () => {
    setLayoutConfig(prev => ({
      ...prev,
      showRightPanel: !prev.showRightPanel
    }))
  }

  const toggleMaximize = () => {
    setLayoutConfig(prev => ({
      ...prev,
      isMaximized: !prev.isMaximized
    }))
  }

  // Helper functions
  const getMockFileContent = (filePath: string): string => {
    const contentMap: Record<string, string> = {
      'src/components/Button.tsx': `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export function Button({ children, variant = 'primary', onClick }: ButtonProps) {
  return (
    <button 
      className={\`px-4 py-2 rounded \${variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}`,
      'src/components/Header.tsx': `import React from 'react';

export function Header() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900">My App</h1>
      </div>
    </header>
  );
}`,
      'src/App.tsx': `import React from 'react';
import { Header } from './components/Header';
import { Button } from './components/Button';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4">Welcome</h2>
        <Button onClick={() => console.log('Clicked!')}>
          Get Started
        </Button>
      </main>
    </div>
  );
}

export default App;`,
      'README.md': '# My Project\n\nThis is a sample project demonstrating the UI components.',
      'package.json': '{\n  "name": "my-project",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.0.0",\n    "typescript": "^4.0.0"\n  }\n}'
    }
    
    return contentMap[filePath] || `// ${filePath}\n\n// File content would be loaded here`
  }

  const updateFileStatus = (nodes: FileNode[], path: string, status: FileNode['status']): FileNode[] => {
    return nodes.map(node => {
      if (node.path === path) {
        return { ...node, status }
      }
      if (node.children) {
        return { ...node, children: updateFileStatus(node.children, path, status) }
      }
      return node
    })
  }

  // Calculate panel widths
  const centerPanelWidth = 100 - 
    (layoutConfig.showLeftPanel ? layoutConfig.leftPanelWidth : 0) - 
    (layoutConfig.showRightPanel ? layoutConfig.rightPanelWidth : 0)

  return (
    <div className={cn("flex flex-col h-screen bg-gray-100", className)}>
      {/* Top Bar */}
      <div className="flex items-center justify-between p-2 bg-white border-b">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-gray-900">AI Coding Assistant</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleLeftPanel}
            className="h-8 px-2"
          >
            <PanelLeft className={cn("w-4 h-4", !layoutConfig.showLeftPanel && "text-gray-400")} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleRightPanel}
            className="h-8 px-2"
          >
            <PanelRight className={cn("w-4 h-4", !layoutConfig.showRightPanel && "text-gray-400")} />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefreshFiles}
            className="h-8 px-2"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleMaximize}
            className="h-8 px-2"
          >
            {layoutConfig.isMaximized ? 
              <Minimize2 className="w-4 h-4" /> : 
              <Maximize2 className="w-4 h-4" />
            }
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Project Tree */}
        {layoutConfig.showLeftPanel && (
          <div 
            className="border-r bg-white flex flex-col"
            style={{ width: `${layoutConfig.leftPanelWidth}%` }}
          >
            <ProjectTree
              files={files}
              onFileSelect={handleFileSelect}
              onRefresh={handleRefreshFiles}
            />
          </div>
        )}

        {/* Center Panel - File Editor */}
        <div 
          className="flex flex-col bg-white"
          style={{ width: `${centerPanelWidth}%` }}
        >
          <FileEditor
            file={fileContent}
            onChange={handleFileChange}
            onSave={handleFileSave}
            onAccept={handleFileAccept}
            onReject={handleFileReject}
            className="flex-1"
          />
        </div>

        {/* Right Panel - Chat Command Center */}
        {layoutConfig.showRightPanel && (
          <div 
            className="border-l bg-white flex flex-col"
            style={{ width: `${layoutConfig.rightPanelWidth}%` }}
          >
            <StableChatCommandCenter
              messages={messages}
              onSendMessage={handleSendMessage}
              onExecutePlan={handleExecutePlan}
              onRejectPlan={handleRejectPlan}
              ollamaUrl={ollamaUrl}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Export the component
export default Phase6UILayout