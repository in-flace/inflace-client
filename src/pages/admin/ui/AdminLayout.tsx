'use client'

import { useEffect } from 'react'
import { AdminSidebar } from '@/features/admin'
import { useSidebarStore } from '@/widgets/layout/sidebar'

type Props = {
  children: React.ReactNode
}

/* 마이페이지와 같은 셸: 글로벌 사이드바는 접고 서브 내비 카드 + 콘텐츠 */
export function AdminLayout({ children }: Props) {
  const setOpen = useSidebarStore((state) => state.setOpen)

  useEffect(() => {
    setOpen(false)
    return () => setOpen(true)
  }, [setOpen])

  return (
    <div className='flex size-full bg-background-gray-default'>
      <AdminSidebar />
      {children}
    </div>
  )
}
