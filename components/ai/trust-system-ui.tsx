'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Plus, 
  Minus, 
  Edit3,
  Eye,
  EyeOff
} from 'lucide-react'

// Types matching the backend
interface PreviewContent {
  type: 'full' | 'diff' | 'confirmation'
  filePath: string
  title: string
  content: string
  metadata: {
    linesAdded: number
    linesRemoved: number
    linesModified: number
    totalLines: number
  }
  actions: {
    id: string
    label: string
    type: 'accept' | 'reject' | 'partial' | 'view_original'
    primary?: boolean
    danger?: boolean
  }[]
}

interface ChangeRequestSummary {
  requestId: string
  status: 'pending' | 'accept' | 'reject' | 'partial'
  fileCount: number
  changes: {
    created: number
    updated: number
    deleted: number
  }
  stats: {
    linesAdded: number
    linesRemoved: number
  }
}

interface TrustSystemUIProps {
  taskId: string
  userId: string
  requestId: string
  onDecisionMade?: (filePath: string, decision: string) => void
  onAllDecisionsMade?: (status: 'accept' | 'reject' | 'partial') => void
}

export function TrustSystemUI({ 
  taskId, 
  userId, 
  requestId,
  onDecisionMade,
  onAllDecisionsMade
}: TrustSystemUIProps) {
  const [summary, setSummary] = useState<ChangeRequestSummary | null>(null)
  const [previews, setPreviews] = useState<PreviewContent[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)

  // Load initial data
  useEffect(() => {
    loadChangeRequest()
  }, [requestId])

  const loadChangeRequest = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // In a real implementation, this would call your API
      // const response = await fetch(`/api/trust/${requestId}/summary`)
      // const data = await response.json()
      
      // Mock data for demonstration
      const mockSummary: ChangeRequestSummary = {
        requestId,
        status: 'pending',
        fileCount: 3,
        changes: {
          created: 1,
          updated: 1,
          deleted: 1
        },
        stats: {
          linesAdded: 45,
          linesRemoved: 23
        }
      }
      
      const mockPreviews: PreviewContent[] = [
        {
          type: 'full',
          filePath: 'components/new-component.tsx',
          title: '📄 New File: components/new-component.tsx',
          content: '1    | import React from \'react\';\n2    | \n3    | export function NewComponent() {\n4    |   return <div>Hello World</div>;\n5    | }',
          metadata: {
            linesAdded: 5,
            linesRemoved: 0,
            linesModified: 0,
            totalLines: 5
          },
          actions: [
            { id: 'accept-1', label: 'Accept New File', type: 'accept', primary: true },
            { id: 'reject-1', label: 'Reject', type: 'reject', danger: true }
          ]
        },
        {
          type: 'diff',
          filePath: 'lib/utils.ts',
          title: '📝 Updated File: lib/utils.ts',
          content: '  10 | export function formatString(str: string): string {\n- 11 |   return str.trim().toLowerCase();\n+ 11 |   return str.trim().toUpperCase();\n  12 | }',
          metadata: {
            linesAdded: 1,
            linesRemoved: 1,
            linesModified: 1,
            totalLines: 3
          },
          actions: [
            { id: 'accept-2', label: 'Accept Changes', type: 'accept', primary: true },
            { id: 'reject-2', label: 'Reject Changes', type: 'reject', danger: true },
            { id: 'partial-2', label: 'Partial Accept', type: 'partial' },
            { id: 'view-2', label: 'View Original', type: 'view_original' }
          ]
        },
        {
          type: 'confirmation',
          filePath: 'deprecated/file.ts',
          title: '🗑️ Delete File: deprecated/file.ts',
          content: '⚠️  You are about to DELETE this file!\nFile: deprecated/file.ts\nSize: 1250 bytes\nLines: 25\n\nFirst 5 lines of content:\n1    | // This file is deprecated\n2    | const oldFunction = () => {\n3    |   console.log("old code");\n4    | }',
          metadata: {
            linesAdded: 0,
            linesRemoved: 25,
            linesModified: 0,
            totalLines: 25
          },
          actions: [
            { id: 'accept-3', label: 'Confirm Delete', type: 'accept', primary: true, danger: true },
            { id: 'reject-3', label: 'Cancel', type: 'reject' }
          ]
        }
      ]
      
      setSummary(mockSummary)
      setPreviews(mockPreviews)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load change request')
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (filePath: string, decision: string) => {
    try {
      // In real implementation, call API to record decision
      // await fetch(`/api/trust/${requestId}/decide`, {
      //   method: 'POST',
      //   body: JSON.stringify({ filePath, decision })
      // })
      
      // Update local state
      if (onDecisionMade) {
        onDecisionMade(filePath, decision)
      }
      
      // If all files have decisions, notify parent
      const allDecided = previews.every(preview => 
        preview.filePath === filePath || 
        // Check if this file already has a decision (in real impl)
        false
      )
      
      if (allDecided && onAllDecisionsMade) {
        // Determine overall status based on decisions
        onAllDecisionsMade(decision === 'accept' ? 'accept' : 'reject')
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record decision')
    }
  }

  const handleAcceptAll = async () => {
    try {
      // In real implementation, call API to accept all
      // await fetch(`/api/trust/${requestId}/accept-all`, { method: 'POST' })
      
      if (onAllDecisionsMade) {
        onAllDecisionsMade('accept')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept changes')
    }
  }

  const handleRejectAll = async () => {
    try {
      // In real implementation, call API to reject all
      // await fetch(`/api/trust/${requestId}/reject-all`, { method: 'POST' })
      
      if (onAllDecisionsMade) {
        onAllDecisionsMade('reject')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject changes')
    }
  }

  const getChangeTypeIcon = (type: 'full' | 'diff' | 'confirmation') => {
    switch (type) {
      case 'full': return <Plus className="w-4 h-4 text-green-500" />
      case 'diff': return <Edit3 className="w-4 h-4 text-blue-500" />
      case 'confirmation': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getChangeTypeColor = (type: 'full' | 'diff' | 'confirmation') => {
    switch (type) {
      case 'full': return 'border-green-200 bg-green-50'
      case 'diff': return 'border-blue-200 bg-blue-50'
      case 'confirmation': return 'border-red-200 bg-red-50'
      default: return 'border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading change request...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
        <div className="text-destructive font-medium">Error</div>
        <div className="text-sm text-destructive/80">{error}</div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">No change request found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📋 Change Summary</span>
            <Badge variant={summary.status === 'pending' ? 'default' : 
                          summary.status === 'accept' ? 'default' : 
                          summary.status === 'reject' ? 'destructive' : 'secondary'}>
              {summary.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{summary.fileCount}</div>
              <div className="text-sm text-muted-foreground">Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+{summary.stats.linesAdded}</div>
              <div className="text-sm text-muted-foreground">Lines Added</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">-{summary.stats.linesRemoved}</div>
              <div className="text-sm text-muted-foreground">Lines Removed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {summary.stats.linesAdded - summary.stats.linesRemoved > 0 ? '+' : ''}
                {summary.stats.linesAdded - summary.stats.linesRemoved}
              </div>
              <div className="text-sm text-muted-foreground">Net Change</div>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {summary.changes.created > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Plus className="w-3 h-3" /> {summary.changes.created} Created
              </Badge>
            )}
            {summary.changes.updated > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Edit3 className="w-3 h-3" /> {summary.changes.updated} Updated
              </Badge>
            )}
            {summary.changes.deleted > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Minus className="w-3 h-3" /> {summary.changes.deleted} Deleted
              </Badge>
            )}
          </div>
          
          {/* Accept/Reject All Buttons */}
          {summary.status === 'pending' && (
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={handleAcceptAll}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept All Changes
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRejectAll}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject All Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Previews */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Files to Review</h3>
        
        {previews.map((preview) => (
          <Card 
            key={preview.filePath}
            className={`overflow-hidden ${getChangeTypeColor(preview.type)}`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                {getChangeTypeIcon(preview.type)}
                {preview.title}
                {selectedFile === preview.filePath ? (
                  <Badge variant="outline">Selected</Badge>
                ) : (
                  <Badge variant="secondary">
                    {preview.metadata.linesAdded > 0 && `+${preview.metadata.linesAdded} `}
                    {preview.metadata.linesRemoved > 0 && `-${preview.metadata.linesRemoved}`}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {/* File Content Preview */}
              <div className="bg-muted p-3 rounded mb-4 font-mono text-sm max-h-60 overflow-auto">
                <pre className="whitespace-pre-wrap">{preview.content}</pre>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {preview.actions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.primary ? 'default' : 
                            action.danger ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => handleDecision(preview.filePath, action.type)}
                    className="flex items-center gap-1"
                  >
                    {action.type === 'accept' && <CheckCircle className="w-4 h-4" />}
                    {action.type === 'reject' && <XCircle className="w-4 h-4" />}
                    {action.type === 'partial' && <Edit3 className="w-4 h-4" />}
                    {action.type === 'view_original' && (
                      showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}