import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromReq } from '@/lib/session/server'
import { db } from '@/lib/db/client'
import { tasks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest, context: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await context.params

    const session = await getSessionFromReq(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the task belongs to the user
    const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)

    if (!task[0] || task[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Return empty files array for now (placeholder implementation)
    // In a real implementation, this would fetch actual files from the task
    return NextResponse.json({
      success: true,
      files: [],
      fileTree: {},
    })
  } catch (error) {
    console.error('Error fetching task files:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}
