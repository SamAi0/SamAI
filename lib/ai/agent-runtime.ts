import { db } from '@/lib/db/client'
import { tasks, taskMessages, logEntrySchema } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { getAIGenerator, AIRequest, AIResponse } from './generator'
import { getWorkspaceRoot } from '@/lib/security/file-access-control.node'
import { VirtualFilesystemLayer } from './virtual-filesystem'
import { FileEditingIntelligence } from './file-editing-intelligence'
import * as fs from 'fs/promises'
import * as path from 'path'
import { generateId } from '@/lib/utils/id'

export class AgentRuntime {
    private taskId: string
    private userId: string
    private workspaceRoot: string
    private generator = getAIGenerator()

    constructor(taskId: string, userId: string) {
        this.taskId = taskId
        this.userId = userId
        // Enforce workspace isolation
        this.workspaceRoot = getWorkspaceRoot(taskId)
    }

    /**
     * Initialize the workspace directory
     */
    async initWorkspace(): Promise<void> {
        try {
            await fs.mkdir(this.workspaceRoot, { recursive: true })
            console.log(`[AgentRuntime] Initialized workspace at ${this.workspaceRoot}`)
        } catch (error) {
            console.error(`[AgentRuntime] Failed to initialize workspace: ${error}`)
            throw error
        }
    }

    /**
     * Start a new task processing loop
     */
    async startTask(prompt: string): Promise<void> {
        await this.initWorkspace()

        // Log start
        await this.log('info', 'Task processing started')

        // Construct system prompt
        const systemPrompt = `You are an AI software engineering agent called "Antigravity".
Your goal is to complete the user's task by planning, executing, and verifying your changes.
You are working in an isolated workspace: ${this.workspaceRoot}

Current Task: ${prompt}

You can edit files, creating them if necessary.
Always verify your work.`

        try {
            // 1. Save user prompt as first message if not exists
            // Check if messages already exist (deduplication)
            const existingMessages = await db.select().from(taskMessages).where(eq(taskMessages.taskId, this.taskId))
            if (existingMessages.length === 0) {
                await db.insert(taskMessages).values({
                    id: generateId(),
                    taskId: this.taskId,
                    role: 'user',
                    content: prompt,
                    createdAt: new Date(),
                })
            }

            // 2. Generate initial plan/response
            await this.updateStatus('processing')

            const response = await this.generator.generate({
                taskId: this.taskId,
                prompt: prompt,
                systemPrompt: systemPrompt,
                context: 'Initial task start'
            })

            // 3. Save AI response
            await db.insert(taskMessages).values({
                id: generateId(),
                taskId: this.taskId,
                role: 'agent',
                content: response.content,
                createdAt: new Date(),
            })

            await this.log('success', 'Initial analysis completed')
            await this.updateStatus('pending') // Waiting for user or next step
        } catch (error) {
            console.error('[AgentRuntime] Error starting task:', error)
            await this.log('error', `Task start failed: ${error instanceof Error ? error.message : String(error)}`)
            await this.updateStatus('error', String(error))
            throw error
        }
    }

    /**
     * Handle chat interaction
     */
    async chat(message: string): Promise<string> {
        await this.initWorkspace()

        // Save user message
        await db.insert(taskMessages).values({
            id: generateId(),
            taskId: this.taskId,
            role: 'user',
            content: message,
            createdAt: new Date(),
        })

        // Load history
        const history = await db
            .select()
            .from(taskMessages)
            .where(eq(taskMessages.taskId, this.taskId))
            .orderBy(asc(taskMessages.createdAt))

        // Convert history to context string
        const context = history.map((msg: { role: string, content: string }) => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')

        const systemPrompt = `You are Antigravity, an AI assistant working on a codebase in: ${this.workspaceRoot}`

        const response = await this.generator.generate({
            taskId: this.taskId,
            prompt: message,
            systemPrompt: systemPrompt,
            context: context
        })

        // Save AI response
        await db.insert(taskMessages).values({
            id: generateId(),
            taskId: this.taskId,
            role: 'agent',
            content: response.content,
            createdAt: new Date(),
        })

        return response.content
    }

    /**
     * Handle streaming chat interaction
     */
    async streamChat(message: string, onChunk: (chunk: string) => void): Promise<string> {
        await this.initWorkspace()

        // Save user message
        await db.insert(taskMessages).values({
            id: generateId(),
            taskId: this.taskId,
            role: 'user',
            content: message,
            createdAt: new Date(),
        })

        // Load history
        const history = await db
            .select()
            .from(taskMessages)
            .where(eq(taskMessages.taskId, this.taskId))
            .orderBy(asc(taskMessages.createdAt))

        // Convert history to context string
        const context = history.map((msg: typeof taskMessages.$inferSelect) => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')

        const systemPrompt = `You are Antigravity, an AI assistant working on a codebase in: ${this.workspaceRoot}`

        let fullResponse = ''

        await this.generator.stream({
            taskId: this.taskId,
            prompt: message,
            systemPrompt: systemPrompt,
            context: context
        }, (chunk) => {
            fullResponse += chunk
            onChunk(chunk)
        })

        // Save AI response
        await db.insert(taskMessages).values({
            id: generateId(),
            taskId: this.taskId,
            role: 'agent',
            content: fullResponse,
            createdAt: new Date(),
        })

        return fullResponse
    }

    /**
     * Execute an AI-driven file edit
     */
    async editFile(filePath: string, instruction: string): Promise<any> {
        await this.initWorkspace() // Ensure exist

        const vfs = new VirtualFilesystemLayer(this.taskId, this.userId, this.workspaceRoot)

        // Load file content for context
        let fileContent = ''
        try {
            await vfs.loadFile(filePath)
            const file = vfs.getFile(filePath)
            if (file) fileContent = file.content
        } catch (e) {
            // Ignore if new file
        }

        const prompt = `You are an expert software engineer.
Modify "${filePath}" according to: "${instruction}"

Current Content:
\`\`\`
${fileContent}
\`\`\`

Return ONLY the complete new content.`

        const response = await this.generator.generate({
            taskId: this.taskId,
            prompt: prompt
        })

        let cleanContent = response.content.trim()
        // Strip markdown blocks if present
        const codeBlockRegex = /^```[a-z]*\n([\s\S]*?)\n```$/
        const match = cleanContent.match(codeBlockRegex)
        if (match) {
            cleanContent = match[1]
        }

        const fileEditingIntelligence = new FileEditingIntelligence(vfs, {
            preferPatches: true,
            maxRetries: 3
        })

        const result = await fileEditingIntelligence.updateFileWithMinimalChanges(filePath, cleanContent)

        await this.log('success', `Edited file: ${filePath}`)
        return result
    }

    // --- Helpers ---

    private async log(type: 'info' | 'command' | 'error' | 'success', message: string) {
        const entry = {
            type,
            message,
            timestamp: new Date(),
        }

        // Append to existing logs
        // Note: This naive update might be racy, but sufficient for now. 
        // Ideally we'd append to a jsonb array in a better way or use a separate table.
        const task = await db.select().from(tasks).where(eq(tasks.id, this.taskId)).limit(1)
        if (task[0]) {
            const currentLogs = (task[0].logs as any[]) || []
            await db.update(tasks)
                .set({ logs: [...currentLogs, entry] as any })
                .where(eq(tasks.id, this.taskId))
        }
    }

    private async updateStatus(status: 'pending' | 'processing' | 'completed' | 'error' | 'stopped', error?: string) {
        await db.update(tasks)
            .set({ status, error: error || null, updatedAt: new Date() })
            .where(eq(tasks.id, this.taskId))
    }
}
