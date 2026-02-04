import type { NextRequest } from 'next/server'
import type { Session, SessionUserInfo } from '@/lib/session/types'
import { getSessionFromReq } from '@/lib/session/server'

export async function GET(req: NextRequest) {
  const existingSession = await getSessionFromReq(req)

  // Return the existing session - no token refresh needed for Google OAuth
  const session = existingSession

  const response = new Response(JSON.stringify(await getData(session)), {
    headers: { 'Content-Type': 'application/json' },
  })

  // Save the session - no provider-specific logic needed

  return response
}

async function getData(session: Session | undefined): Promise<SessionUserInfo> {
  if (!session) {
    return { user: undefined }
  } else {
    return { user: session.user, authProvider: session.authProvider }
  }
}
