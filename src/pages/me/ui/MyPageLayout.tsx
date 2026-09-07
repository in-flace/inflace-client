'use client'

import { useEffect } from 'react'
import { MyPageSidebar } from '@/features/me'
import { useSidebarStore } from '@/widgets/layout/sidebar'

type Props = {
  children: React.ReactNode
}

export function MyPageLayout({ children }: Props) {
  const setOpen = useSidebarStore((state) => state.setOpen)

  useEffect(() => {
    setOpen(false)
    return () => setOpen(true)
  }, [setOpen])

  return (
    <div className='flex size-full min-w-0 flex-col bg-background-gray-default lg:flex-row'>
      <MyPageSidebar />
      {children}
    </div>
  )
}
