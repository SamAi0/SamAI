import Phase7CursorLikeFeatures from '@/components/ui/phase7-cursor-features'

export default function Phase7Demo() {
  // Sample project files for demonstration
  const sampleProjectFiles = [
    'package.json',
    'next.config.js',
    'tsconfig.json',
    'src/app/page.tsx',
    'src/app/layout.tsx',
    'src/components/Button.tsx',
    'src/components/Card.tsx',
    'src/lib/utils.ts',
    'src/styles/globals.css',
    'public/favicon.ico',
    'README.md',
    'src/__tests__/Button.test.tsx',
    'src/hooks/useAuth.ts'
  ]

  const handleFileCreate = async (request: any) => {
    console.log('File creation requested:', request)
    // Simulate file creation
    alert(`Would create file: ${request.fileName}${request.content ? ' with template content' : ''}`)
    return true
  }

  const handleChangeConfirm = (changeId: string) => {
    console.log('Change confirmed:', changeId)
    alert(`Change ${changeId} confirmed!`)
  }

  return (
    <div className="h-screen">
      <Phase7CursorLikeFeatures
        projectFiles={sampleProjectFiles}
        projectRoot="/workspace/project"
        onFileCreate={handleFileCreate}
        onChangeConfirm={handleChangeConfirm}
      />
    </div>
  )
}