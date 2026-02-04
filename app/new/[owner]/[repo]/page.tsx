import { cookies } from 'next/headers'
import { HomePageContent } from '@/components/home-page-content'
import { getServerSession } from '@/lib/session/get-server-session'

interface NewRepoPageProps {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export default async function NewRepoPage({ params }: NewRepoPageProps) {
  const { owner, repo } = await params

  const cookieStore = await cookies()
  const installDependencies = cookieStore.get('install-dependencies')?.value === 'true'
  const keepAlive = cookieStore.get('keep-alive')?.value === 'true'

  const session = await getServerSession()

  const maxDuration = Math.max(1, parseInt(cookieStore.get('max-duration')?.value || '300', 10)) || 300 // Default to 300 minutes

  return (
    <HomePageContent
      initialSelectedOwner={owner}
      initialSelectedRepo={repo}
      initialInstallDependencies={installDependencies}
      initialMaxDuration={maxDuration}
      initialKeepAlive={keepAlive}
      maxSandboxDuration={maxDuration}
      user={session?.user ?? null}
      initialStars={1200}
    />
  )
}
