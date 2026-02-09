import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session/get-server-session'
import { db } from '@/lib/db/client'
import { tasks, taskMessages } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { generateId } from '@/lib/utils/id'

export async function POST(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId } = await params
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Verify the task belongs to the user and exists
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id), isNull(tasks.deletedAt)))
      .limit(1)

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Create user message
    const messageId = generateId(16)
    await db.insert(taskMessages).values({
      id: messageId,
      taskId,
      role: 'user',
      content: message,
      createdAt: new Date(),
    })

    // Return success response
    return NextResponse.json({
      success: true,
      messageId,
      message: 'Message saved successfully',
    })
  } catch (error) {
    console.error('Error in continue task API:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}