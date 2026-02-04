import { getServerSession } from '@/lib/session/get-server-session'
import { TasksListClient } from '@/components/tasks-list-client'
import { redirect } from 'next/navigation'

export default async function TasksListPage() {
  const session = await getServerSession()

  // Redirect to home if not authenticated
  if (!session?.user) {
    redirect('/')
  }

  return <TasksListClient user={session.user} authProvider={session.authProvider} initialStars={1200} />
}
