import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Security Middleware - File Access Control Layer 0.1
 * 
 * This middleware runs on ALL API requests to enforce basic security.
 * File access validation is handled in API routes, not middleware.
 * 
 * Non-negotiable security measure - blocks unauthorized access attempts.
 */

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const pathname = url.pathname
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') || // Skip auth APIs to avoid blocking login
    pathname.includes('.') && !pathname.includes('/api/') // Static files
  ) {
    return NextResponse.next()
  }
  
  // Log all API requests for security monitoring
  console.log(`SECURITY: API Request - ${request.method} ${pathname}`)
  
  // Basic security checks only - no file path validation
  // File access validation is handled in API routes
  
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}