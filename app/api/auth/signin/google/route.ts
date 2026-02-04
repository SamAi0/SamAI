import { type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { generateState } from 'arctic'
import { isRelativeUrl } from '@/lib/utils/is-relative-url'
import { getSessionFromReq } from '@/lib/session/server'

export async function GET(req: NextRequest): Promise<Response> {
  // Check if user is already authenticated
  const session = await getSessionFromReq(req)

  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`

  if (!clientId) {
    return Response.redirect(new URL('/?error=google_not_configured', req.url))
  }

  const state = generateState()
  const store = await cookies()
  let redirectTo = isRelativeUrl(req.nextUrl.searchParams.get('next') ?? '/')
    ? (req.nextUrl.searchParams.get('next') ?? '/')
    : '/'

  // If user is already authenticated, treat this as a "Connect Google" flow
  // Otherwise, treat it as a "Sign in with Google" flow
  const isSignInFlow = !session?.user
  const authMode = isSignInFlow ? 'signin' : 'connect'

  // Add a query parameter to show a toast message after redirect
  if (!isSignInFlow) {
    const redirectUrl = new URL(redirectTo, req.nextUrl.origin)
    redirectUrl.searchParams.set('google_connected', 'true')
    redirectTo = redirectUrl.pathname + redirectUrl.search
  }

  // Store state and redirect URL
  const cookiesToSet: [string, string][] = [
    [`google_oauth_redirect`, redirectTo],
    [`google_oauth_state`, state],
  ]

  // If connecting (user already signed in), store their user ID
  if (!isSignInFlow && session?.user?.id) {
    cookiesToSet.push([`google_oauth_user_id`, session.user.id])
  }

  for (const [key, value] of cookiesToSet) {
    store.set(key, value, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 10, // 10 minutes
      sameSite: 'lax',
    })
  }

  // Build Google authorization URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope:
      'openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    state: state,
    response_type: 'code',
  })

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  // Redirect directly to Google
  return Response.redirect(url)
}
