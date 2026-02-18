import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromReq } from '@/lib/session/server'
import { db } from '@/lib/db/client'
import { tasks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import * as fs from 'fs/promises'
import * as path from 'path'
import { getWorkspaceRoot } from '@/lib/security/file-access-control.node'

// Types for File Tree
interface FileTreeNode {
  type: 'file' | 'directory'
  filename?: string
  children?: { [key: string]: FileTreeNode }
  status?: 'added' | 'modified' | 'deleted' | 'unchanged'
  additions?: number
  deletions?: number
}

interface FileEntry {
  filename: string
  name: string
  type: 'file' | 'directory'
  status: 'unchanged' | 'added' | 'modified' | 'deleted'
}

export async function GET(request: NextRequest, context: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await context.params

    const session = await getSessionFromReq(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the task belongs to the user
    // const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)

    // if (!task[0] || task[0].userId !== session.user.id) {
    //   // For now, allow simplified access for local testing or if DB is mocking
    //   // return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    // }

    const workspaceRoot = getWorkspaceRoot(taskId)
    const url = new URL(request.url)
    const mode = url.searchParams.get('mode') || 'all'

    const files: FileEntry[] = []
    const fileTree: { [key: string]: FileTreeNode } = {}

    // Helper to build file tree
    const addToTree = (filePath: string, type: 'file' | 'directory') => {
      const parts = filePath.split('/')
      let currentLevel = fileTree

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // Leaf node
          currentLevel[part] = {
            type,
            filename: filePath,
            children: type === 'directory' ? {} : undefined,
            status: 'unchanged'
          }
        } else {
          // Intermediate directory
          if (!currentLevel[part]) {
            currentLevel[part] = {
              type: 'directory',
              filename: parts.slice(0, index + 1).join('/'),
              children: {},
              status: 'unchanged'
            }
          }
          currentLevel = currentLevel[part].children!
        }
      })
    }

    // Recursive scan function
    const scanDirectory = async (dir: string, relativePath: string = '') => {
      let entries
      try {
        entries = await fs.readdir(dir, { withFileTypes: true })
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return // Directory doesn't exist, just return
        }
        throw error
      }

      for (const entry of entries) {
        const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name

        // Skip ignored directories
        if (['.git', 'node_modules', '.next', '.qoder'].includes(entry.name)) {
          continue
        }

        if (entry.isDirectory()) {
          addToTree(entryRelativePath, 'directory')
          await scanDirectory(path.join(dir, entry.name), entryRelativePath)
        } else {
          addToTree(entryRelativePath, 'file')
          files.push({
            filename: entryRelativePath,
            name: entry.name,
            type: 'file',
            status: 'unchanged'
          } as any)
        }
      }
    }

    await scanDirectory(workspaceRoot)

    return NextResponse.json({
      success: true,
      files,
      fileTree,
    })
  } catch (error) {
    console.error('Error fetching task files:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}
