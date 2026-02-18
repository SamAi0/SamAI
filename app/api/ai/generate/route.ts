import { NextRequest, NextResponse } from 'next/server'
import { getAIGenerator } from '@/lib/ai/generator'

export async function POST(req: NextRequest) {
    try {
        const { prompt, context, taskId } = await req.json()

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        const generator = getAIGenerator()
        const response = await generator.generate({
            taskId: taskId || 'default',
            prompt,
            context
        })

        return NextResponse.json({ success: true, data: response })
    } catch (error: any) {
        console.error('AI Generation error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to generate response' },
            { status: 500 }
        )
    }
}
