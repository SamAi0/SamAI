'use client'

import { useState, useEffect } from 'react'
import { TaskForm } from '@/components/task-form'
import { HomePageHeader } from '@/components/home-page-header'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTasks } from '@/components/app-layout'
import type { Session } from '@/lib/session/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getEnabledAuthProviders } from '@/lib/auth/providers'
import { useSetAtom } from 'jotai'
import { taskPromptAtom } from '@/lib/atoms/task'
import { HomePageMobileFooter } from '@/components/home-page-mobile-footer'
import Link from 'next/link'

interface HomePageContentProps {
  initialInstallDependencies?: boolean
  initialMaxDuration?: number
  initialKeepAlive?: boolean
  maxSandboxDuration?: number
  user?: Session['user'] | null
  initialStars?: number | null
}

export function HomePageContent({
  initialInstallDependencies = false,
  initialMaxDuration = 300,
  initialKeepAlive = false,
  maxSandboxDuration = 300,
  user = null,
  initialStars = 1200,
}: HomePageContentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSignInDialog, setShowSignInDialog] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshTasks, addTaskOptimistically } = useTasks()
  const setTaskPrompt = useSetAtom(taskPromptAtom)

  // Check which auth providers are enabled
  // const { github: hasGitHub } = getEnabledAuthProviders() // GitHub auth is removed

  // GitHub connection functionality removed since GitHub auth is removed

  const handleTaskSubmit = async (data: {
    prompt: string
    selectedAgent: string
    selectedModel: string
    selectedModels?: string[]
    installDependencies: boolean
    maxDuration: number
    keepAlive: boolean
  }) => {
    // Check if user is authenticated
    if (!user) {
      setShowSignInDialog(true)
      return
    }

    // Check if user has provided a prompt
    if (!data.prompt) {
      toast.error('Please enter a task description')
      return
    }

    // Clear the saved prompt since we're actually submitting it now
    setTaskPrompt('')

    setIsSubmitting(true)

    // Create task
    const { id } = addTaskOptimistically(data)

    // Navigate to the new task page immediately
    router.push(`/tasks/${id}`)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, id }), // Include the pre-generated ID
      })

      if (response.ok) {
        toast.success('Task created successfully!')
        // Refresh sidebar to get the real task data from server
        await refreshTasks()
      } else {
        const error = await response.json()
        // Show detailed message for rate limits, or generic error message
        toast.error(error.message || error.error || 'Failed to create task')
        // TODO: Remove the optimistic task on error
        await refreshTasks() // For now, just refresh to remove the optimistic task
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
      // TODO: Remove the optimistic task on error
      await refreshTasks() // For now, just refresh to remove the optimistic task
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 bg-background flex flex-col">
      <div className="p-3">
        <HomePageHeader user={user} initialStars={initialStars} />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-20 md:pb-4">
        <TaskForm
          onSubmit={handleTaskSubmit}
          isSubmitting={isSubmitting}
          initialInstallDependencies={initialInstallDependencies}
          initialMaxDuration={initialMaxDuration}
          initialKeepAlive={initialKeepAlive}
          maxSandboxDuration={maxSandboxDuration}
        />
      </div>

      {/* Mobile Footer with Stars and Deploy Button - Show when logged in */}
      {user && <HomePageMobileFooter initialStars={initialStars} />}

      {/* Sign In Dialog */}
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to continue</DialogTitle>
            <DialogDescription>
              {'You need to sign in to create tasks. Choose how you want to sign in.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4"></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
