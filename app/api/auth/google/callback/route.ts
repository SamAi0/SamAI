import { type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createGoogleSession, saveSession as saveGoogleSession } from '@/lib/session/create-google'
import { encrypt } from '@/lib/crypto'
import { db } from '@/lib/db/client'
import { accounts, users, tasks, connectors, keys } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'

// Debug environment variables at module load
console.log('[Google OAuth] Environment check at startup:')
console.log(
  '[Google OAuth] GOOGLE_CLIENT_ID:',
  process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NOT SET',
)
console.log('[Google OAuth] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET (hidden)' : 'NOT SET')

export async function GET(req: NextRequest): Promise<Response> {
  console.log('[Google Callback] Starting OAuth callback processing')
  console.log('[Google Callback] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID)
  console.log('[Google Callback] GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET)

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const cookieStore = await cookies()

  console.log('[Google Callback] Received code:', !!code)
  console.log('[Google Callback] Received state:', state)

  const storedState = cookieStore.get(`google_oauth_state`)?.value ?? null
  const storedRedirectTo = cookieStore.get(`google_oauth_redirect`)?.value ?? null
  const storedUserId = cookieStore.get(`google_oauth_user_id`)?.value ?? null // Required for connect flow

  console.log('[Google Callback] Stored state:', storedState)
  console.log('[Google Callback] Stored redirect:', storedRedirectTo)
  console.log('[Google Callback] Stored user ID:', storedUserId)

  // Check if user is signing in (no stored user ID) or connecting (has stored user ID)
  const isSignInFlow = !storedUserId

  // Validate OAuth state for both flows
  if (code === null || state === null || storedState !== state || storedRedirectTo === null) {
    console.log('[Google Callback] State validation failed:', {
      code: !!code,
      state: !!state,
      stateMatch: storedState === state,
      redirectTo: !!storedRedirectTo,
    })
    return new Response('Invalid OAuth state', {
      status: 400,
    })
  }

  // For connect flow, we also need storedUserId
  if (!isSignInFlow && storedUserId === null) {
    console.log('[Google Callback] Connect flow missing user ID')
    return new Response('Invalid OAuth state', {
      status: 400,
    })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.log('[Google Callback] Missing OAuth credentials:', { clientId: !!clientId, clientSecret: !!clientSecret })
    return new Response('Google OAuth not configured', {
      status: 500,
    })
  }

  try {
    console.log('[Google Callback] Processing OAuth callback')

    // Exchange code for access token
    console.log('[Google Callback] Exchanging authorization code for access token')
    console.log('[Google Callback] Exchange request details:', {
      code: code ? `${code.substring(0, 10)}...` : 'null',
      clientId: clientId ? `${clientId.substring(0, 10)}...` : 'null',
      redirectUri: `${req.nextUrl.origin}/api/auth/google/callback`,
    })

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${req.nextUrl.origin}/api/auth/google/callback`,
      }),
    })

    console.log('[Google Callback] Token exchange response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[Google Callback] Token exchange failed with status:', tokenResponse.status)
      console.error('[Google Callback] Token exchange error response:', errorText)
      return new Response(`Failed to authenticate with Google: ${errorText}`, { status: 400 })
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string
      refresh_token?: string
      scope: string
      token_type: string
      expires_in: number
      error?: string
      error_description?: string
    }

    console.log('[Google Callback] Token data received:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      scope: tokenData.scope,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      hasError: !!tokenData.error,
    })

    if (tokenData.error) {
      console.error('[Google Callback] Token exchange error:', tokenData.error, tokenData.error_description)
      return new Response(`Google OAuth error: ${tokenData.error} - ${tokenData.error_description}`, { status: 400 })
    }

    if (isSignInFlow) {
      // SIGN-IN FLOW: Create a new session for the Google user
      console.log('[Google Callback] Creating new user session')
      const session = await createGoogleSession(
        tokenData.access_token,
        tokenData.refresh_token || null,
        tokenData.scope,
      )

      if (!session) {
        console.error('[Google Callback] Failed to create Google session')
        return new Response('Failed to create session', { status: 500 })
      }

      console.log('[Google Callback] User session created successfully')
      // Note: Tokens are already stored in users table by upsertUser() in createGoogleSession()

      // Create response with redirect
      const response = new Response(null, {
        status: 302,
        headers: {
          Location: storedRedirectTo,
        },
      })

      // Save session to cookie
      await saveGoogleSession(response, session)

      // Clean up cookies
      cookieStore.delete(`google_auth_state`)
      cookieStore.delete(`google_auth_redirect_to`)
      cookieStore.delete(`google_auth_mode`)

      return response
    } else {
      // CONNECT FLOW: Add Google account to existing user
      // Encrypt the access token before storing
      const encryptedToken = encrypt(tokenData.access_token)
      const encryptedRefreshToken = tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined

      // First, we need to get the Google user info to get the sub (unique ID)
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/json',
        },
      })

      if (!userInfoResponse.ok) {
        console.error('Failed to fetch Google user info')
        return new Response('Failed to fetch Google user info', { status: 400 })
      }

      const rawUserInfo = await userInfoResponse.json()
      // Google user info retrieved successfully

      // Google OAuth response may use 'id' instead of 'sub' - use whichever is available
      if (!rawUserInfo.sub && !rawUserInfo.id) {
        console.error('[Google Callback] Missing required unique identifier (sub/id) in Google user data:', rawUserInfo)
        return new Response('Missing required user data from Google', { status: 400 })
      }

      // Map the Google user data, using id as fallback for sub
      const googleUser = {
        ...rawUserInfo,
        sub: rawUserInfo.sub || rawUserInfo.id,
      } as {
        id: string
        email: string
        verified_email: boolean
        name: string
        given_name: string
        family_name: string
        picture: string
        locale: string
        hd?: string // Hosted domain (for Google Workspace)
        sub: string // Google's unique user identifier
      }

      // Check if this Google account is already connected somewhere
      const existingAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.provider, 'google'), eq(accounts.externalUserId, googleUser.sub)))
        .limit(1)

      if (existingAccount.length > 0) {
        const connectedUserId = existingAccount[0].userId

        // If the Google account belongs to a different user, we need to merge accounts
        if (connectedUserId !== storedUserId) {
          console.log(`[Google Callback] Merging existing account with current user`)

          // Transfer all tasks, connectors, accounts, and keys from old user to new user
          await db.update(tasks).set({ userId: storedUserId! }).where(eq(tasks.userId, connectedUserId))
          await db.update(connectors).set({ userId: storedUserId! }).where(eq(connectors.userId, connectedUserId))
          await db.update(accounts).set({ userId: storedUserId! }).where(eq(accounts.userId, connectedUserId))
          await db.update(keys).set({ userId: storedUserId! }).where(eq(keys.userId, connectedUserId))

          // Delete the old user record (this will cascade delete their accounts/keys)
          await db.delete(users).where(eq(users.id, connectedUserId))

          console.log(`[Google Callback] Account merge completed successfully`)

          // Update the Google account token
          await db
            .update(accounts)
            .set({
              userId: storedUserId!,
              accessToken: encryptedToken,
              refreshToken: encryptedRefreshToken,
              scope: tokenData.scope,
              username: googleUser.email?.split('@')[0] || googleUser.name?.replace(/\s+/g, '') || 'google_user',
              updatedAt: new Date(),
            })
            .where(eq(accounts.id, existingAccount[0].id))
        } else {
          // Same user, just update the token
          await db
            .update(accounts)
            .set({
              accessToken: encryptedToken,
              refreshToken: encryptedRefreshToken,
              scope: tokenData.scope,
              username: googleUser.email?.split('@')[0] || googleUser.name?.replace(/\s+/g, '') || 'google_user',
              updatedAt: new Date(),
            })
            .where(eq(accounts.id, existingAccount[0].id))
        }
      } else {
        // No existing Google account connection, create a new one
        await db.insert(accounts).values({
          id: nanoid(),
          userId: storedUserId!,
          provider: 'google',
          externalUserId: googleUser.sub, // Store Google's unique ID
          accessToken: encryptedToken,
          refreshToken: encryptedRefreshToken,
          scope: tokenData.scope,
          username: googleUser.email?.split('@')[0] || googleUser.name?.replace(/\s+/g, '') || 'google_user',
        })
      }

      // Clean up cookies
      cookieStore.delete(`google_oauth_state`)
      cookieStore.delete(`google_oauth_redirect`)
      cookieStore.delete(`google_oauth_user_id`)

      // Redirect back to app
      return Response.redirect(new URL(storedRedirectTo, req.nextUrl.origin))
    }
  } catch (error) {
    console.error('[Google Callback] Authentication failed:', error instanceof Error ? error.message : 'Unknown error')
    return new Response('Failed to complete Google authentication', { status: 500 })
  }
}
