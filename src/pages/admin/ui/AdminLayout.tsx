'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth'
import { AdminSidebar } from '@/features/admin'
import { useSidebarStore } from '@/widgets/layout/sidebar'

type Props = {
  children: React.ReactNode
}

/* 마이페이지와 같은 셸: 글로벌 사이드바는 접고 서브 내비 카드 + 콘텐츠.
 * 로그인 여부는 상위 AuthGuardLayout이 보장하고, 여기서는 ADMIN 플랜만 본다.
 * 진짜 권한 검증은 서버(403)이고 이건 비관리자가 빈 화면을 보지 않게 하는 용도 */
export function AdminLayout({ children }: Props) {
  const router = useRouter()
  const setOpen = useSidebarStore((state) => state.setOpen)
  const { user, isUserLoading } = useAuth()
  const isAdmin = user?.userDetails.plan === 'ADMIN'

  useEffect(() => {
    setOpen(false)
    return () => setOpen(true)
  }, [setOpen])

  useEffect(() => {
    if (user && !isAdmin) router.replace('/')
  }, [user, isAdmin, router])

  if (isUserLoading || !isAdmin) return null

  return (
    <div className='flex size-full bg-background-gray-default'>
      <AdminSidebar />
      <div className='min-w-0 flex-1'>{children}</div>
    </div>
  )
}
