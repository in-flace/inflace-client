'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/features/auth'

/* 유튜브 채널을 연동한 유저만 접근 가능한 레이아웃 */
export function ChannelLinkedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isInitializing, isUserLoading, user } = useAuth()

  useEffect(() => {
    if (
      !isInitializing &&
      !isUserLoading &&
      (!user?.userChannelDetails?.youtubeChannelName ||
        !user?.userChannelDetails?.youtubeChannelId)
    ) {
      router.replace('/')
    }
  }, [
    isInitializing,
    isUserLoading,
    user?.userChannelDetails?.youtubeChannelName,
    user?.userChannelDetails?.youtubeChannelId,
    router,
  ])

  if (
    isInitializing ||
    isUserLoading ||
    !user?.userChannelDetails?.youtubeChannelName ||
    !user?.userChannelDetails?.youtubeChannelId
  )
    return <div className='invisible'>{children}</div>

  return <>{children}</>
}
