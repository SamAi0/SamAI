import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromReq } from '@/lib/session/server'
import { AgentRuntime } from '@/lib/ai/agent-runtime'

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ taskId: string }> }
) {
    try {
        const session = await getSessionFromReq(request)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { taskId } = await context.params
        const body = await request.json()
        const { message } = body

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const runtime = new AgentRuntime(taskId, session.user.id)

                    await runtime.streamChat(message, (chunk) => {
                        // Send SSE format matching existing frontend expectation
                        const data = {
                            type: 'response',
                            content: chunk,
                        }
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
                    })

                    // Send done signal
                    const doneData = {
                        type: 'done',
                        content: '',
                    }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneData)}\n\n`))
                    controller.close()
                } catch (error) {
                    console.error('Stream error:', error)
                    // Try to send error to client if possible
                    try {
                        const errorData = {
                            type: 'error',
                            error: error instanceof Error ? error.message : 'Unknown error'
                        }
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`))
                    } catch (e) {
                        // ignore
                    }
                    controller.error(error)
                }
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })

    } catch (error) {
        console.error('Error in task chat API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
