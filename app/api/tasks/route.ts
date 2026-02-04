import { NextRequest, NextResponse, after } from 'next/server'
import { TokenLimiter, TOKEN_LIMITS } from '@/lib/utils/token-limiter'
import { db } from '@/lib/db/client'
import { tasks, insertTaskSchema, connectors, taskMessages } from '@/lib/db/schema'
import { generateId } from '@/lib/utils/id'
import { eq, desc, or, and, isNull } from 'drizzle-orm'
import { createTaskLogger } from '@/lib/utils/task-logger'
// Repository utility functions removed since repository functionality is removed
import { decrypt } from '@/lib/crypto'
import { getSessionFromReq } from '@/lib/session/server'
// GitHub functionality removed since repository functionality is removed
import { getUserApiKeys } from '@/lib/api-keys/user-keys'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { DEFAULT_MODELS } from '@/lib/constants'

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

    // Generate AI branch name after response is sent (non-blocking)
    after(async () => {
      try {
        // AI branch name generation is temporarily disabled (Vercel AI Gateway removed)
        console.log('AI branch name generation temporarily disabled - using fallback method')
        return

        const logger = createTaskLogger(taskId)
        await logger.info('Generating AI-powered branch name...')

        // Extract repository name from URL for context
        let repoName: string | undefined
        try {
          const url = new URL(validatedData.repoUrl || '')
          const pathParts = url.pathname.split('/')
          if (pathParts.length >= 3) {
            repoName = pathParts[pathParts.length - 1].replace(/\.git$/, '')
          }
        } catch {
          // Ignore URL parsing errors
        }

        // Skip AI branch name generation since repository functionality is removed
        console.log('Skipping branch name generation - repository functionality removed')
      } catch (error) {
        console.error('Error generating AI branch name:', error)

        // Use simple fallback branch name
        const fallbackBranchName = `task-${taskId}`

        try {
          await db
            .update(tasks)
            .set({
              branchName: fallbackBranchName,
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, taskId))

          const logger = createTaskLogger(taskId)
          await logger.info('Using fallback branch name')
        } catch (dbError) {
          console.error('Error updating task with fallback branch name:', dbError)
        }
      }
    })

    // Generate AI title after response is sent (non-blocking)
    after(async () => {
      try {
        // AI title generation is temporarily disabled (Vercel AI Gateway removed)
        console.log('AI title generation temporarily disabled - using fallback method')
        return

        // Extract repository name from URL for context
        let repoName: string | undefined
        try {
          const url = new URL(validatedData.repoUrl || '')
          const pathParts = url.pathname.split('/')
          if (pathParts.length >= 3) {
            repoName = pathParts[pathParts.length - 1].replace(/\.git$/, '')
          }
        } catch {
          // Ignore URL parsing errors
        }

        // Skip AI title generation since repository functionality is removed
        console.log('Skipping title generation - repository functionality removed')
      } catch (error) {
        console.error('Error generating AI title:', error)

        // Use simple fallback title
        const fallbackTitle =
          validatedData.prompt.length > 50 ? validatedData.prompt.substring(0, 50) + '...' : validatedData.prompt

        try {
          await db
            .update(tasks)
            .set({
              title: fallbackTitle,
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, taskId))
        } catch (dbError) {
          console.error('Error updating task with fallback title:', dbError)
        }
      }
    })

    // Get user's API keys, GitHub token, and GitHub user info BEFORE entering after() block (where session is not accessible)
    const userApiKeys = await getUserApiKeys()
    // GitHub functionality removed since repository functionality is removed
    const userGithubToken = null
    const githubUser = null
    const maxSandboxDuration = 300 // Default to 300 minutes
    const userId = session.user.id // Extract user ID before entering after() block

    // Process the task asynchronously with timeout
    // CRITICAL: Wrap in after() to ensure Vercel doesn't kill the function after response
    // Without this, serverless functions terminate immediately after sending the response
    after(async () => {
      try {
        await processTaskWithTimeout(
          newTask.id,
          validatedData.prompt,
          validatedData.repoUrl || '',
          maxSandboxDuration,
          validatedData.selectedAgent || 'claude',
          validatedData.selectedModel,
          validatedData.installDependencies || false,
          false,
          userApiKeys,
          userGithubToken,
          githubUser,
          userId, // Pass user ID to after() block
        )
      } catch (error) {
        console.error('Task processing failed:', error)
        // Error handling is already done inside processTaskWithTimeout
      }
    })

    return NextResponse.json({ task: newTask })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

async function processTaskWithTimeout(
  taskId: string,
  prompt: string,
  repoUrl: string,
  maxDuration: number,
  selectedAgent: string = 'ollama',
  selectedModel?: string,
  installDependencies: boolean = false,
  keepAlive: boolean = false,
  apiKeys?: {
    OPENAI_API_KEY?: string
    GEMINI_API_KEY?: string
    CURSOR_API_KEY?: string
    ANTHROPIC_API_KEY?: string
    // AI_GATEWAY_API_KEY?: string // Removed - Vercel AI Gateway dependency
  },
  githubToken?: string | null,
  githubUser?: {
    username: string
    name: string | null
    email: string | null
  } | null,
  userId?: string,
) {
  const TASK_TIMEOUT_MS = maxDuration * 60 * 1000 // Convert minutes to milliseconds

  // Add a warning 1 minute before timeout
  const warningTimeMs = Math.max(TASK_TIMEOUT_MS - 60 * 1000, 0)
  const warningTimeout = setTimeout(async () => {
    try {
      const warningLogger = createTaskLogger(taskId)
      await warningLogger.info('Task is approaching timeout, will complete soon')
    } catch (error) {
      console.error('Failed to add timeout warning:', error)
    }
  }, warningTimeMs)

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Task execution timed out after ${maxDuration} minutes`))
    }, TASK_TIMEOUT_MS)
  })

  try {
    await Promise.race([
      processTask(
        taskId,
        prompt,
        repoUrl,
        maxDuration,
        selectedAgent,
        selectedModel,
        installDependencies,
        keepAlive,
        apiKeys,
        githubToken,
        githubUser,
        userId,
      ),
      timeoutPromise,
    ])

    // Clear the warning timeout if task completes successfully
    clearTimeout(warningTimeout)
  } catch (error: unknown) {
    // Clear the warning timeout on any error
    clearTimeout(warningTimeout)
    // Handle timeout specifically
    if (error instanceof Error && error.message?.includes('timed out after')) {
      console.error('Task timed out:', taskId)

      // Use logger for timeout error
      const timeoutLogger = createTaskLogger(taskId)
      await timeoutLogger.error('Task execution timed out')
      await timeoutLogger.updateStatus('error', 'Task execution timed out. The operation took too long to complete.')
    } else {
      // Re-throw other errors to be handled by the original error handler
      throw error
    }
  }
}

// Helper function to wait for AI-generated branch name
async function waitForBranchName(taskId: string, maxWaitMs: number = 10000): Promise<string | null> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId))
      if (task?.branchName) {
        return task.branchName
      }
    } catch (error) {
      console.error('Error checking for branch name:', error)
    }

    // Wait 500ms before checking again
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return null
}

// Helper function to check if task was stopped
async function isTaskStopped(taskId: string): Promise<boolean> {
  try {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
    return task?.status === 'stopped'
  } catch (error) {
    console.error('Error checking task status:', error)
    return false
  }
}

async function processTask(
  taskId: string,
  prompt: string,
  repoUrl: string,
  maxDuration: number,
  selectedAgent: string = 'ollama',
  selectedModel?: string,
  installDependencies: boolean = false,
  keepAlive: boolean = false,
  apiKeys?: {
    OPENAI_API_KEY?: string
    GEMINI_API_KEY?: string
    CURSOR_API_KEY?: string
    ANTHROPIC_API_KEY?: string
    // AI_GATEWAY_API_KEY?: string // Removed - Vercel AI Gateway dependency
  },
  githubToken?: string | null,
  githubUser?: {
    username: string
    name: string | null
    email: string | null
  } | null,
  userId?: string,
) {
  const logger = createTaskLogger(taskId)
  const taskStartTime = Date.now()

  try {
    console.log('Starting task processing')

    // Update task status to processing with real-time logging
    await logger.updateStatus('processing', 'Task created, preparing to start...')
    await logger.updateProgress(10, 'Initializing task execution...')

    // Save the user's message
    try {
      await db.insert(taskMessages).values({
        id: generateId(12),
        taskId,
        role: 'user',
        content: prompt,
      })
    } catch (error) {
      console.error('Failed to save user message:', error)
    }

    // GitHub token and API keys are passed as parameters (retrieved before entering after() block)
    if (githubToken) {
      await logger.info('Using authenticated GitHub access')
    }
    await logger.info('API keys configured for selected agent')

    // Check if task was stopped before we even start
    if (await isTaskStopped(taskId)) {
      await logger.info('Task was stopped before execution began')
      return
    }

    // Wait for AI-generated branch name (with timeout)
    const aiBranchName = await waitForBranchName(taskId, 10000)

    // Check if task was stopped during branch name generation
    if (await isTaskStopped(taskId)) {
      await logger.info('Task was stopped during branch name generation')
      return
    }

    if (aiBranchName) {
      await logger.info('Using AI-generated branch name')
    } else {
      await logger.info('AI branch name not ready, will use fallback during task creation')
    }

    await logger.updateProgress(15, 'Preparing task environment')
    console.log('Preparing task')

    // Prepare for agent execution
    const branchName = aiBranchName || `task-${taskId}`
    console.log('Preparing for agent execution')

    // Update branch name (only update if not already set by AI)
    if (!aiBranchName) {
      await db
        .update(tasks)
        .set({
          branchName,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId))
    }

    // Check if task was stopped before agent execution
    if (await isTaskStopped(taskId)) {
      await logger.info('Task was stopped before agent execution')
      return
    }

    // Log agent execution start
    await logger.updateProgress(50, 'Executing agent')
    console.log('Starting agent execution')

    type Connector = typeof connectors.$inferSelect

    let mcpServers: Connector[] = []

    try {
      // Use passed userId to filter connectors
      if (userId) {
        const userConnectors = await db
          .select()
          .from(connectors)
          .where(and(eq(connectors.userId, userId), eq(connectors.status, 'connected')))

        mcpServers = userConnectors.map((connector: Connector) => {
          // Decrypt sensitive fields
          const decryptedEnv = connector.env ? JSON.parse(decrypt(connector.env)) : null
          return {
            ...connector,
            env: decryptedEnv,
            oauthClientSecret: connector.oauthClientSecret ? decrypt(connector.oauthClientSecret) : null,
          }
        })

        if (mcpServers.length > 0) {
          await logger.info('Found connected MCP servers')

          // Store MCP server IDs in the task
          await db
            .update(tasks)
            .set({
              mcpServerIds: JSON.parse(JSON.stringify(mcpServers.map((s) => s.id))),
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, taskId))
        } else {
          await logger.info('No connected MCP servers found for current user')
        }
      } else {
        await logger.info('No user session found, continuing without MCP servers')
      }
    } catch (mcpError) {
      console.error('Failed to fetch MCP servers:', mcpError)
      await logger.info('Warning: Could not fetch MCP servers, continuing without them')
    }

    // Sanitize prompt to prevent CLI option parsing issues
    const sanitizedPrompt = prompt
      .replace(/`/g, "'") // Replace backticks with single quotes
      .replace(/\$/g, '') // Remove dollar signs
      .replace(/\\/g, '') // Remove backslashes
      .replace(/^-/gm, ' -') // Prefix lines starting with dash to avoid CLI option parsing

    // Generate agent message ID for streaming updates
    // Execute actual Ollama agent with comprehensive error handling
    try {
      // First, verify Ollama is accessible
      const healthResponse = await fetch('http://localhost:11434/api/tags')
      if (!healthResponse.ok) {
        await logger.error(
          'Ollama service is not accessible. Please ensure Ollama is running on http://localhost:11434',
        )
        await logger.updateStatus(
          'error',
          'Ollama service is not accessible. Please ensure Ollama is running on http://localhost:11434',
        )
        return
      }

      // Check if the selected model exists in Ollama
      const healthData = await healthResponse.json()
      const availableModels = healthData.models?.map((m: any) => m.name) || []

      if (
        selectedModel &&
        !availableModels.some(
          (model: string) =>
            model.toLowerCase().includes(selectedModel.toLowerCase()) ||
            selectedModel.toLowerCase().includes(model.toLowerCase()),
        )
      ) {
        await logger.error(
          `Selected model '${selectedModel}' is not loaded in Ollama. Available models: ${availableModels.join(', ') || 'none'}`,
        )
        await logger.updateStatus(
          'error',
          `Selected model '${selectedModel}' is not loaded in Ollama. Available models: ${availableModels.join(', ') || 'none'}`,
        )
        return
      }

      // Check if task was stopped before agent execution
      if (await isTaskStopped(taskId)) {
        await logger.info('Task was stopped before agent execution')
        return
      }

      // Hard context limits using token limiter utility
      const modelLimits = TokenLimiter.getModelLimits(selectedModel || DEFAULT_MODELS.ollama)
      const {
        content: truncatedPrompt,
        truncated,
        originalTokens,
        finalTokens,
      } = TokenLimiter.truncateToTokens(
        sanitizedPrompt,
        modelLimits.maxMessageTokens,
        TOKEN_LIMITS.SYSTEM_PROMPT_BUFFER,
      )

      if (truncated) {
        await logger.info(`Prompt truncated from ${originalTokens} to ${finalTokens} tokens to prevent token explosion`)
      }

      // Validate token limits
      const validation = TokenLimiter.validateTokenLimit(
        truncatedPrompt,
        modelLimits.maxContextTokens,
        TOKEN_LIMITS.SYSTEM_PROMPT_BUFFER,
      )

      if (!validation.valid) {
        await logger.error(validation.message || 'Token limit exceeded')
        await logger.updateStatus('error', validation.message || 'Token limit exceeded')
        return
      }

      // Execute Ollama API call
      const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel || 'codellama',
          messages: [
            {
              role: 'system',
              content: `You are an AI coding assistant. The user wants you to help implement the following task in the repository. Provide code changes and explanations as needed. Focus on solving the problem effectively and efficiently.`,
            },
            {
              role: 'user',
              content: truncatedPrompt,
            },
          ],
          stream: false, // We're not streaming in the background task
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_ctx: modelLimits.maxContextTokens, // Hard limit on context size
          },
        }),
      })

      if (!ollamaResponse.ok) {
        const errorData = await ollamaResponse.text()
        console.error('Ollama API error:', ollamaResponse.status, errorData)

        // Determine specific error type
        if (ollamaResponse.status === 400) {
          await logger.error(`Ollama request error: ${errorData}`)
          await logger.updateStatus('error', `Ollama request error: ${errorData}`)
        } else if (ollamaResponse.status === 404) {
          await logger.error(`Model not found in Ollama: ${selectedModel || 'codellama'}`)
          await logger.updateStatus('error', `Model not found in Ollama: ${selectedModel || 'codellama'}`)
        } else if (ollamaResponse.status === 500) {
          // Likely memory or resource issue
          if (errorData.toLowerCase().includes('memory') || errorData.toLowerCase().includes('ram')) {
            await logger.error(
              'Ollama model execution failed due to insufficient memory/RAM. Please free up system resources and try again.',
            )
            await logger.updateStatus('error', 'Insufficient memory/RAM for model execution')
          } else {
            await logger.error(`Ollama internal error: ${errorData}`)
            await logger.updateStatus('error', `Ollama internal error: ${errorData}`)
          }
        } else {
          await logger.error(`Ollama API error: ${ollamaResponse.status} - ${errorData}`)
          await logger.updateStatus('error', `Ollama API error: ${ollamaResponse.status}`)
        }
        return
      }

      const responseData = await ollamaResponse.json()
      const responseContent = responseData.message?.content || 'No response from agent'

      // Save the agent response
      try {
        await db.insert(taskMessages).values({
          id: generateId(12),
          taskId,
          role: 'agent',
          content: responseContent,
        })
      } catch (saveError) {
        console.error('Failed to save agent message:', saveError)
      }

      await logger.success('Agent execution completed successfully')
      await logger.info('Code changes applied successfully')
    } catch (ollamaError: any) {
      console.error('Ollama execution error:', ollamaError)

      // Determine specific error type
      if (ollamaError.code === 'ECONNREFUSED') {
        await logger.error(
          'Cannot connect to Ollama service. Please ensure Ollama is running on http://localhost:11434',
        )
        await logger.updateStatus('error', 'Cannot connect to Ollama service')
      } else if (
        ollamaError.message?.toLowerCase().includes('memory') ||
        ollamaError.message?.toLowerCase().includes('ram')
      ) {
        await logger.error(
          'Ollama model execution failed due to insufficient memory/RAM. Please free up system resources and try again.',
        )
        await logger.updateStatus('error', 'Insufficient memory/RAM for model execution')
      } else {
        await logger.error(`Agent execution failed: ${ollamaError.message}`)
        await logger.updateStatus('error', `Agent execution failed: ${ollamaError.message}`)
      }
      return
    }

    // Generate AI-powered commit message
    let commitMessage: string
    try {
      // Extract repository name from URL for context
      let repoName: string | undefined
      try {
        const url = new URL(repoUrl)
        const pathParts = url.pathname.split('/')
        if (pathParts.length >= 3) {
          repoName = pathParts[pathParts.length - 1].replace(/\.git$/, '')
        }
      } catch {
        // Ignore URL parsing errors
      }

      // Use simple fallback commit message
      commitMessage = `Update: ${prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt}`
    } catch (error) {
      console.error('Error generating commit message:', error)
      commitMessage = `Update: ${prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt}`
    }

    // Simulate pushing changes to branch
    await logger.info('Simulated pushing changes to branch')

    // Update task as completed
    await logger.updateStatus('completed')
    await logger.updateProgress(100, 'Task completed successfully')

    console.log('Task completed successfully')
  } catch (error) {
    console.error('Error processing task:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    // Log the error and update task status
    await logger.error('Error occurred during task processing')
    await logger.updateStatus('error', errorMessage)
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
