'use client'

import { User } from '@/components/auth/user'
import type { Session } from '@/lib/session/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface HomePageHeaderProps {
  user?: Session['user'] | null
}

export function HomePageHeader({ user }: HomePageHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">AI Development Platform</h1>
        <div className="flex gap-2">
          <Link href="/file-creation-test">
            <Button variant="outline" size="sm">
              Test File Creation
            </Button>
          </Link>
          <Link href="/phase12-demo">
            <Button variant="outline" size="sm">
              Diff Review Demo
            </Button>
          </Link>
        </div>
      </div>
      <User user={user} />
    </div>
  )
}
