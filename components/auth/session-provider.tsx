'use client'

import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { sessionAtom, sessionInitializedAtom } from '@/lib/atoms/session'
import type { SessionUserInfo } from '@/lib/session/types'

export function SessionProvider() {
  const setSession = useSetAtom(sessionAtom)
  const setInitialized = useSetAtom(sessionInitializedAtom)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/info')
        const data: SessionUserInfo = await response.json()
        setSession(data)
        setInitialized(true)
      } catch (error) {
        console.error('Failed to fetch session:', error)
        setSession({ user: undefined })
        setInitialized(true)
      }
    }

    const fetchAll = async () => {
      await fetchSession()
    }

    fetchAll()

    // Refresh both every minute
    const interval = setInterval(fetchAll, 60000)

    // Refresh on focus
    const handleFocus = () => fetchAll()
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [setSession, setInitialized])

  return null
}
