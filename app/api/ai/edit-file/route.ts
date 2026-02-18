import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromReq } from '@/lib/session/server'
import { AgentRuntime } from '@/lib/ai/agent-runtime'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { filePath, instruction, taskId } = body

        if (!filePath || !instruction) {
            return NextResponse.json({ error: 'File path and instruction are required' }, { status: 400 })
        }

        if (!taskId) {
            return NextResponse.json({ error: 'Task ID is required for editing' }, { status: 400 })
        }

        const runtime = new AgentRuntime(taskId, session.user.id)

        // Use the unified agent runtime to edit the file
        const result = await runtime.editFile(filePath, instruction)

        return NextResponse.json({
            success: true,
            result
        })

    } catch (error: any) {
        console.error('AI Edit File error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to edit file' },
            { status: 500 }
        )
    }
}
