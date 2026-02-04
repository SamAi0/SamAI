import 'server-only'

import type { Session, Tokens } from './types'
import { SESSION_COOKIE_NAME } from './constants'
import { encryptJWE } from '@/lib/jwe/encrypt'
import { upsertUser } from '@/lib/db/users'
import { encrypt } from '@/lib/crypto'
import ms from 'ms'

export async function createSession(tokens: Tokens): Promise<Session | undefined> {
  // Since Vercel support is removed, this function should handle Google OAuth
  // This function creates a session for Google OAuth
  throw new Error('Vercel authentication has been removed. Please use Google OAuth instead.')
}

const COOKIE_TTL = ms('1y')

export async function saveSession(res: Response, session: Session | undefined): Promise<string | undefined> {
  if (!session) {
    res.headers.append(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Lax`,
    )
    return
  }

  const value = await encryptJWE(session, '1y')
  const expires = new Date(Date.now() + COOKIE_TTL).toUTCString()
  res.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${value}; Path=/; Max-Age=${COOKIE_TTL / 1000}; Expires=${expires}; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Lax`,
  )
  return value
}
