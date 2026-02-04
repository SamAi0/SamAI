import { cookies } from 'next/headers'
import { HomePageContent } from '@/components/home-page-content'
import { getServerSession } from '@/lib/session/get-server-session'

interface OwnerRepoPageProps {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export default async function OwnerRepoPage({ params }: OwnerRepoPageProps) {
  const { owner, repo } = await params

  const cookieStore = await cookies()
  const installDependencies = cookieStore.get('install-dependencies')?.value === 'true'
  const keepAlive = cookieStore.get('keep-alive')?.value === 'true'

  const session = await getServerSession()

  const cookieValue = cookieStore.get('max-duration')?.value
  const parsedValue = parseInt(cookieValue || '300', 10)
  const maxDuration = isNaN(parsedValue) ? 300 : Math.max(1, parsedValue) // Default to 300 minutes

  return (
    <HomePageContent
      initialInstallDependencies={installDependencies}
      initialMaxDuration={maxDuration}
      initialKeepAlive={keepAlive}
      maxSandboxDuration={maxDuration}
      user={session?.user ?? null}
      initialStars={1200}
    />
  )
}
