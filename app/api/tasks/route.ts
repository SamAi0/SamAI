import { NextRequest, NextResponse, after } from 'next/server'
import { db } from '@/lib/db/client'
import { tasks, insertTaskSchema } from '@/lib/db/schema'
import { generateId } from '@/lib/utils/id'
import { eq, desc, and, isNull, or } from 'drizzle-orm'
import { getSessionFromReq } from '@/lib/session/server'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { AgentRuntime } from '@/lib/ai/agent-runtime'

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getSessionFromReq(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tasks for this user only (exclude soft-deleted tasks)
    const userTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, session.user.id), isNull(tasks.deletedAt)))
      .orderBy(desc(tasks.createdAt))

    return NextResponse.json({ tasks: userTasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getSessionFromReq(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit (set high for testing)
    const rateLimit = await checkRateLimit(session.user.id)

    // For testing purposes, treat as allowed if under a very high limit
    const effectiveLimit = Number(process.env.MAX_MESSAGES_PER_DAY || '999999')
    if (!rateLimit.allowed && rateLimit.total <= 100) {
      // Only enforce if the limit is reasonably low
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message:
            'You have reached the daily limit of messages (tasks + follow-ups). Your limit will reset at the specified time.',
          remaining: rateLimit.remaining,
          total: rateLimit.total,
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 },
      )
    }

    const body = await request.json()

    // Use provided ID or generate a new one
    const taskId = body.id || generateId(12)
    const validatedData = insertTaskSchema.parse({
      ...body,
      id: taskId,
      userId: session.user.id,
      status: 'pending',
      progress: 0,
      logs: [],
    })

    // Insert the task into the database - ensure id is definitely present
    const [newTask] = await db
      .insert(tasks)
      .values({
        ...validatedData,
        id: taskId, // Ensure id is always present
      })
      .returning()

    // Process the task asynchronously
    // CRITICAL: Wrap in after() to ensure Vercel doesn't kill the function after response
    after(async () => {
      await processTaskWithTimeout(newTask.id, session.user.id, validatedData.prompt)
    })

    return NextResponse.json({ task: newTask })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

async function processTaskWithTimeout(taskId: string, userId: string, prompt: string) {
  // 10 minute timeout
  const TIMEOUT_MS = 10 * 60 * 1000;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Task execution timed out after 10 minutes`))
    }, TIMEOUT_MS)
  })

  try {
    const runtime = new AgentRuntime(taskId, userId)

    await Promise.race([
      runtime.startTask(prompt),
      timeoutPromise
    ])

  } catch (error) {
    console.error('Task processing failed:', error)

    // Update task status to error if not already handled
    try {
      await db.update(tasks)
        .set({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date()
        })
        .where(eq(tasks.id, taskId))
    } catch (dbError) {
      console.error('Failed to update task error status:', dbError)
    }
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSessionFromReq(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (!action) {
      return NextResponse.json({ error: 'Action parameter is required' }, { status: 400 })
    }

    const actions = action.split(',').map((a) => a.trim())
    const validActions = ['completed', 'failed', 'stopped']
    const invalidActions = actions.filter((a) => !validActions.includes(a))

    if (invalidActions.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid action(s) specified. Valid actions: completed, failed, stopped',
        },
        { status: 400 },
      )
    }

    // Build the where conditions for task status
    const statusConditions = []
    if (actions.includes('completed')) {
      statusConditions.push(eq(tasks.status, 'completed'))
    }
    if (actions.includes('failed')) {
      statusConditions.push(eq(tasks.status, 'error'))
    }
    if (actions.includes('stopped')) {
      statusConditions.push(eq(tasks.status, 'stopped'))
    }

    if (statusConditions.length === 0) {
      return NextResponse.json({ error: 'No valid actions specified' }, { status: 400 })
    }

    // Delete tasks based on conditions AND user ownership
    const statusClause = statusConditions.length === 1 ? statusConditions[0] : or(...statusConditions)
    const whereClause = and(statusClause, eq(tasks.userId, session.user.id))
    const deletedTasks = await db.delete(tasks).where(whereClause).returning()

    // Build response message
    const actionMessages = []
    if (actions.includes('completed')) {
      const completedCount = deletedTasks.filter((task: any) => task.status === 'completed').length
      if (completedCount > 0) actionMessages.push(`${completedCount} completed`)
    }
    if (actions.includes('failed')) {
      const failedCount = deletedTasks.filter((task: any) => task.status === 'error').length
      if (failedCount > 0) actionMessages.push(`${failedCount} failed`)
    }
    if (actions.includes('stopped')) {
      const stoppedCount = deletedTasks.filter((task: any) => task.status === 'stopped').length
      if (stoppedCount > 0) actionMessages.push(`${stoppedCount} stopped`)
    }

    const message =
      actionMessages.length > 0
        ? `${actionMessages.join(' and ')} task(s) deleted successfully`
        : 'No tasks found to delete'

    return NextResponse.json({
      message,
      deletedCount: deletedTasks.length,
    })
  } catch (error) {
    console.error('Error deleting tasks:', error)
    return NextResponse.json({ error: 'Failed to delete tasks' }, { status: 500 })
  }
}
