'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  FileText, 
  Folder, 
  FolderOpen, 
  FilePlus, 
  FileEdit, 
  FileMinus,
  ChevronRight,
  ChevronDown,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Types
interface FileNode {
  id: string
  name: string
  path: string
  type: 'file' | 'directory'
  status: 'new' | 'modified' | 'deleted' | 'unchanged'
  children?: FileNode[]
  isExpanded?: boolean
  isSelected?: boolean
}

interface ProjectTreeProps {
  files: FileNode[]
  onFileSelect: (file: FileNode) => void
  onRefresh: () => void
  className?: string
}

// File icon component
function FileIcon({ node }: { node: FileNode }) {
  if (node.type === 'directory') {
    return node.isExpanded ? 
      <FolderOpen className="w-4 h-4 text-muted-foreground" /> : 
      <Folder className="w-4 h-4 text-muted-foreground" />
  }
  
  // Status-based file icons
  switch (node.status) {
    case 'new':
      return <FilePlus className="w-4 h-4 text-muted-foreground" />
    case 'modified':
      return <FileEdit className="w-4 h-4 text-muted-foreground" />
    case 'deleted':
      return <FileMinus className="w-4 h-4 text-muted-foreground" />
    default:
      return <FileText className="w-4 h-4 text-muted-foreground" />
  }
}

// Status badge component
function StatusBadge({ status }: { status: FileNode['status'] }) {
  switch (status) {
    case 'new':
      return <Badge variant="default" className="bg-green-100 text-green-800">New</Badge>
    case 'modified':
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Modified</Badge>
    case 'deleted':
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Deleted</Badge>
    default:
      return null
  }
}

// Recursive tree node component
function TreeNode({ 
  node, 
  onToggle, 
  onSelect,
  depth = 0 
}: { 
  node: FileNode
  onToggle: (id: string) => void
  onSelect: (node: FileNode) => void
  depth?: number
}) {
  const hasChildren = node.children && node.children.length > 0
  
  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 cursor-pointer transition-colors",
          node.isSelected && "bg-muted border-l-2 border-border"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.id)
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {node.isExpanded ? 
              <ChevronDown className="w-3 h-3" /> : 
              <ChevronRight className="w-3 h-3" />
            }
          </button>
        ) : (
          <div className="w-3 h-3" />
        )}
        
        <FileIcon node={node} />
        
        <span className="flex-1 text-sm truncate">
          {node.name}
        </span>
        
        <StatusBadge status={node.status} />
      </div>
      
      {hasChildren && node.isExpanded && (
        <div className="border-l border-border ml-3">
          {node.children?.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              onToggle={onToggle}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Main Project Tree Component
export function ProjectTree({ 
  files, 
  onFileSelect, 
  onRefresh,
  className 
}: ProjectTreeProps) {
  const [treeData, setTreeData] = useState<FileNode[]>([])
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)

  // Initialize tree data
  useEffect(() => {
    setTreeData(files)
  }, [files])

  // Toggle directory expansion
  const handleToggle = (id: string) => {
    setTreeData(prev => toggleNode(prev, id))
  }

  // Select file
  const handleSelect = (node: FileNode) => {
    if (node.type === 'file') {
      setSelectedFile(node)
      onFileSelect(node)
    } else {
      handleToggle(node.id)
    }
  }

  // Recursive function to toggle node expansion
  const toggleNode = (nodes: FileNode[], id: string): FileNode[] => {
    return nodes.map(node => {
      if (node.id === id) {
        return { ...node, isExpanded: !node.isExpanded }
      }
      if (node.children) {
        return { ...node, children: toggleNode(node.children, id) }
      }
      return node
    })
  }

  // Expand all nodes
  const expandAll = () => {
    const expandNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => ({
        ...node,
        isExpanded: true,
        children: node.children ? expandNodes(node.children) : undefined
      }))
    }
    setTreeData(expandNodes(treeData))
  }

  // Collapse all nodes
  const collapseAll = () => {
    const collapseNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => ({
        ...node,
        isExpanded: false,
        children: node.children ? collapseNodes(node.children) : undefined
      }))
    }
    setTreeData(collapseNodes(treeData))
  }

  // Update tree with new file status
  const updateFileStatus = (filePath: string, status: FileNode['status']) => {
    const updateStatus = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === filePath) {
          return { ...node, status }
        }
        if (node.children) {
          return { ...node, children: updateStatus(node.children) }
        }
        return node
      })
    }
    setTreeData(updateStatus(treeData))
  }

  // Live update after accept
  const handleAcceptUpdate = (acceptedFiles: string[]) => {
    acceptedFiles.forEach(filePath => {
      updateFileStatus(filePath, 'unchanged')
    })
  }

  return (
    <div className={cn("flex flex-col h-full bg-white border-r", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">Project Files</h3>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={expandAll}
            className="h-6 w-6 p-0"
            title="Expand all"
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={collapseAll}
            className="h-6 w-6 p-0"
            title="Collapse all"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            className="h-6 w-6 p-0"
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto p-2">
        {treeData.length === 0 ? (
          <div className="text-center text-gray-500 text-sm p-4">
            No files to display
          </div>
        ) : (
          <div className="space-y-0.5">
            {treeData.map(node => (
              <TreeNode
                key={node.id}
                node={{
                  ...node,
                  isSelected: selectedFile?.id === node.id
                }}
                onToggle={handleToggle}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-2 border-t text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Files: {files.filter(f => f.type === 'file').length}</span>
          <span>Dirs: {files.filter(f => f.type === 'directory').length}</span>
        </div>
        <div className="flex gap-2 mt-1">
          {files.some(f => f.status === 'new') && (
            <Badge variant="secondary" className="text-foreground bg-muted">
              {files.filter(f => f.status === 'new').length} new
            </Badge>
          )}
          {files.some(f => f.status === 'modified') && (
            <Badge variant="secondary" className="text-foreground bg-muted">
              {files.filter(f => f.status === 'modified').length} modified
            </Badge>
          )}
          {files.some(f => f.status === 'deleted') && (
            <Badge variant="secondary" className="text-foreground bg-muted">
              {files.filter(f => f.status === 'deleted').length} deleted
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// Export utility functions
export { FileIcon, StatusBadge }
export type { FileNode }