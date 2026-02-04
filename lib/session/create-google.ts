import 'server-only'

import type { Session } from './types'
import { SESSION_COOKIE_NAME } from './constants'
import { encryptJWE } from '@/lib/jwe/encrypt'
import { upsertUser } from '@/lib/db/users'
import { encrypt } from '@/lib/crypto'
import ms from 'ms'

interface GoogleUser {
  sub: string // This is required for Google OAuth
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
  given_name?: string
  family_name?: string
  locale?: string
}

export async function createGoogleSession(
  accessToken: string,
  refreshToken: string | null,
  scope?: string,
): Promise<Session | undefined> {
  // Fetch Google user info
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!userResponse.ok) {
    console.error('Failed to fetch Google user')
    return undefined
  }

  const rawGoogleUser = await userResponse.json()

  // Google user data retrieved successfully

  // Google OAuth response may use 'id' instead of 'sub' - use whichever is available
  if (!rawGoogleUser.sub && !rawGoogleUser.id) {
    console.error('[Google Session] Missing required unique identifier (sub/id) in Google user data:', rawGoogleUser)
    return undefined
  }

  // Map the Google user data, using id as fallback for sub
  const googleUser = {
    ...rawGoogleUser,
    sub: rawGoogleUser.sub || rawGoogleUser.id,
  } as GoogleUser

  // Create or update user in database
  console.log('[Google Session] Creating/updating user account')

  // Validate that required fields exist before creating user
  if (!googleUser.sub) {
    console.error('[Google Session] Missing required sub field in Google user data:', googleUser)
    return undefined
  }

  const userId = await upsertUser({
    provider: 'google',
    externalId: googleUser.sub, // Google's unique user identifier
    accessToken: encrypt(accessToken), // Encrypt before storing
    refreshToken: refreshToken ? encrypt(refreshToken) : undefined, // Encrypt if present
    scope: scope || undefined,
    username: googleUser.email?.split('@')[0] || googleUser.name?.replace(/\s+/g, '') || 'google_user', // Use part of email as username, fallback to processed name or default
    email: googleUser.email,
    name: googleUser.name,
    avatarUrl: googleUser.picture,
  })

  const session: Session = {
    created: Date.now(),
    authProvider: 'google',
    user: {
      id: userId, // Internal user ID
      username: googleUser.email?.split('@')[0] || googleUser.name?.replace(/\s+/g, '') || 'google_user',
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.picture || '',
    },
  }

  console.log('[Google Session] User session created successfully')
  return session
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
