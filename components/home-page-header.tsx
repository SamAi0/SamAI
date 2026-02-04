'use client'

import { User } from '@/components/auth/user'
import type { Session } from '@/lib/session/types'

interface HomePageHeaderProps {
  user?: Session['user'] | null
}

export function HomePageHeader({ user }: HomePageHeaderProps) {
  return <User user={user} />
}
