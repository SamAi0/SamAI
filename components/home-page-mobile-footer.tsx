'use client'

import { Button } from '@/components/ui/button'

interface HomePageMobileFooterProps {}

export function HomePageMobileFooter({}: HomePageMobileFooterProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-20">
      <div className="flex items-center justify-center gap-3 p-4" />
    </div>
  )
}
