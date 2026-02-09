'use client'

import type { Session } from '@/lib/session/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { redirectToSignOut } from '@/lib/session/redirect-to-sign-out'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { sessionAtom } from '@/lib/atoms/session'
import { ApiKeysDialog } from '@/components/api-keys-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { Key } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { getEnabledAuthProviders } from '@/lib/auth/providers'

interface RateLimitInfo {
  used: number
  total: number
  remaining: number
}

export function SignOut({ user, authProvider }: Pick<Session, 'user' | 'authProvider'>) {
  const router = useRouter()
  const setSession = useSetAtom(sessionAtom)
  const [showApiKeysDialog, setShowApiKeysDialog] = useState(false)

  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null)

  // Check which auth providers are enabled
  const { google: hasGoogle } = getEnabledAuthProviders()

  const handleSignOut = async () => {
    await redirectToSignOut()
    toast.success('You have been logged out.')
    setSession({ user: undefined })
    router.refresh()
  }

  // Fetch rate limit info on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const response = await fetch('/api/auth/rate-limit')
        if (response.ok && mounted) {
          // Check if the response is JSON before parsing
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json()
            setRateLimit({
              used: data.used,
              total: data.total,
              remaining: data.remaining,
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch rate limit:', error)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const fetchRateLimit = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/rate-limit')
      if (response.ok) {
        // Check if the response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          setRateLimit({
            used: data.used,
            total: data.total,
            remaining: data.remaining,
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch rate limit:', error)
    }
  }, [])

  return (
    <DropdownMenu onOpenChange={(open) => open && fetchRateLimit()}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-full"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar ? `${user.avatar}&s=72` : undefined} alt={user.username} />
            <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2">
          <div className="text-sm font-medium">
            <span>{user.name ?? user.username}</span>
          </div>
          {user.email && <div className="text-sm text-muted-foreground">{user.email}</div>}
          {rateLimit && (
            <div className="text-xs text-muted-foreground mt-1">
              {rateLimit.remaining}/{rateLimit.total} messages remaining today
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        <ThemeToggle />

        <DropdownMenuItem onClick={() => setShowApiKeysDialog(true)} className="cursor-pointer">
          <Key className="h-4 w-4 mr-2" />
          API Keys
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <svg viewBox="0 0 76 65" className="h-3 w-3 mr-2" fill="currentColor">
            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
          </svg>
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>

      <ApiKeysDialog open={showApiKeysDialog} onOpenChange={setShowApiKeysDialog} />
    </DropdownMenu>
  )
}
