import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { checkRateLimit } from '@/lib/utils/rate-limit'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimit = await checkRateLimit(session.user.id)

    // For testing, return the actual rate limit but with high values if under default
    const effectiveTotal = Number(process.env.MAX_MESSAGES_PER_DAY || '999999')
    const isTestMode = effectiveTotal > 1000

    return NextResponse.json({
      allowed: isTestMode ? true : rateLimit.allowed,
      remaining: isTestMode ? effectiveTotal : rateLimit.remaining,
      used: isTestMode ? 0 : rateLimit.total - rateLimit.remaining,
      total: isTestMode ? effectiveTotal : rateLimit.total,
      resetAt: rateLimit.resetAt.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching rate limit:', error)
    return NextResponse.json({ error: 'Failed to fetch rate limit' }, { status: 500 })
  }
}
