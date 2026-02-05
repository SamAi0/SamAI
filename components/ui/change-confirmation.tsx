'use client'

import { useState } from 'react'
import { 
  AlertTriangle,
  ShieldAlert,
  FileText,
  FolderMinus,
  GitBranch,
  X,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// Types
interface ChangeOperation {
  type: 'create' | 'modify' | 'delete' | 'refactor'
  scope: 'file' | 'folder' | 'project-wide'
  path: string
  description?: string
}

interface BigChangeConfirmationProps {
  title: string
  description: string
  operations: ChangeOperation[]
  estimatedImpact: 'low' | 'high'
  onConfirm: () => void
  onCancel: () => void
  className?: string
}

interface ChangeConfirmationSystemProps {
  onChangeConfirm: (changeId: string) => void
  className?: string
}

// Risk assessment levels
const RISK_LEVELS = {
  low: { 
    color: 'bg-green-100 text-green-800',
    icon: FileText,
    message: 'Low impact change'
  },
  medium: { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: AlertTriangle,
    message: 'Medium impact change'
  },
  high: { 
    color: 'bg-red-100 text-red-800',
    icon: ShieldAlert,
    message: 'High impact change - requires confirmation'
  }
} as const

// Big Change Confirmation Dialog Component
export function BigChangeConfirmationDialog({ 
  title,
  description,
  operations,
  estimatedImpact,
  onConfirm,
  onCancel,
  className
}: BigChangeConfirmationProps) {
  const [isOpen, setIsOpen] = useState(true)
  const riskLevel = estimatedImpact === 'high' ? RISK_LEVELS.high : RISK_LEVELS.medium
  
  const handleClose = () => {
    setIsOpen(false)
    onCancel()
  }

  const handleConfirm = () => {
    setIsOpen(false)
    onConfirm()
  }

  // Group operations by type
  const groupedOperations = operations.reduce((acc, op) => {
    if (!acc[op.type]) acc[op.type] = []
    acc[op.type].push(op)
    return acc
  }, {} as Record<string, ChangeOperation[]>)

  // Get operation icon
  const getOperationIcon = (type: ChangeOperation['type']) => {
    switch (type) {
      case 'create': return FileText
      case 'modify': return FileText
      case 'delete': return FolderMinus
      case 'refactor': return GitBranch
      default: return FileText
    }
  }

  // Get operation label
  const getOperationLabel = (type: ChangeOperation['type']) => {
    switch (type) {
      case 'create': return 'Create'
      case 'modify': return 'Modify'
      case 'delete': return 'Delete'
      case 'refactor': return 'Refactor'
      default: return 'Change'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={cn("max-w-2xl", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <riskLevel.icon className={cn("w-5 h-5", riskLevel.color.replace('bg-', 'text-').replace('-100', '-500'))} />
            Confirm Major Change
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Change Summary */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </div>

          {/* Risk Assessment */}
          <Alert>
            <riskLevel.icon className="h-4 w-4" />
            <AlertDescription>
              {riskLevel.message}
            </AlertDescription>
          </Alert>

          {/* Operations Breakdown */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Operations to be performed:</h4>
            <div className="space-y-3">
              {Object.entries(groupedOperations).map(([type, ops]) => {
                const Icon = getOperationIcon(type as ChangeOperation['type'])
                const label = getOperationLabel(type as ChangeOperation['type'])
                
                return (
                  <div key={type} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {ops.length} {ops.length === 1 ? 'operation' : 'operations'}
                      </Badge>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1 ml-6">
                      {ops.map((op, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>
                            {op.path}
                            {op.description && (
                              <span className="text-gray-500 ml-2">({op.description})</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Impact Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Important</h4>
                <p className="text-yellow-700 text-sm">
                  This change affects multiple files and/or folders. Please review the operations 
                  carefully before proceeding. Consider backing up your project if you're unsure.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Change
            </Button>
            <Button 
              onClick={handleConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Change
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main Change Confirmation System
export function ChangeConfirmationSystem({ 
  onChangeConfirm,
  className
}: ChangeConfirmationSystemProps) {
  const [pendingChanges, setPendingChanges] = useState<Record<string, BigChangeConfirmationProps>>({})
  const [confirmedChanges, setConfirmedChanges] = useState<Set<string>>(new Set())

  // Register a change that needs confirmation
  const requestConfirmation = (
    changeId: string,
    title: string,
    description: string,
    operations: ChangeOperation[],
    estimatedImpact: 'low' | 'high' = 'high'
  ) => {
    const changeRequest: BigChangeConfirmationProps = {
      title,
      description,
      operations,
      estimatedImpact,
      onConfirm: () => handleConfirm(changeId),
      onCancel: () => handleCancel(changeId)
    }

    setPendingChanges(prev => ({
      ...prev,
      [changeId]: changeRequest
    }))
  }

  // Handle confirmation
  const handleConfirm = (changeId: string) => {
    setConfirmedChanges(prev => new Set([...prev, changeId]))
    setPendingChanges(prev => {
      const newPending = { ...prev }
      delete newPending[changeId]
      return newPending
    })
    
    onChangeConfirm(changeId)
  }

  // Handle cancellation
  const handleCancel = (changeId: string) => {
    setPendingChanges(prev => {
      const newPending = { ...prev }
      delete newPending[changeId]
      return newPending
    })
  }

  // Check if change is confirmed
  const isConfirmed = (changeId: string): boolean => {
    return confirmedChanges.has(changeId)
  }

  // Get pending change count
  const getPendingCount = (): number => {
    return Object.keys(pendingChanges).length
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Pending Changes Indicator */}
      {getPendingCount() > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {getPendingCount()} Change{getPendingCount() > 1 ? 's' : ''} Awaiting Confirmation
              </span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Review Required
            </Badge>
          </div>
        </div>
      )}

      {/* Render pending confirmation dialogs */}
      {Object.entries(pendingChanges).map(([changeId, props]) => (
        <BigChangeConfirmationDialog
          key={changeId}
          {...props}
        />
      ))}
    </div>
  )
}

// Hook for using change confirmation system
export function useChangeConfirmation() {
  const [confirmedChanges, setConfirmedChanges] = useState<Set<string>>(new Set())

  const requestConfirmation = (
    changeId: string,
    title: string,
    description: string,
    operations: ChangeOperation[],
    estimatedImpact: 'low' | 'high' = 'high'
  ) => {
    // In a real implementation, this would trigger the confirmation dialog
    // For now, we'll simulate the confirmation flow
    console.log('Change confirmation requested:', {
      changeId,
      title,
      description,
      operations,
      estimatedImpact
    })
    
    // Return a promise that resolves when confirmed
    return new Promise<boolean>((resolve) => {
      // Simulate user confirmation (in real app, this would be handled by the dialog)
      const confirmed = window.confirm(
        `Confirm change: ${title}

${description}

This will affect ${operations.length} files.`
      )
      
      if (confirmed) {
        setConfirmedChanges(prev => new Set([...prev, changeId]))
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }

  const isConfirmed = (changeId: string): boolean => {
    return confirmedChanges.has(changeId)
  }

  return {
    requestConfirmation,
    isConfirmed
  }
}

// Export types
export type { ChangeOperation, BigChangeConfirmationProps }