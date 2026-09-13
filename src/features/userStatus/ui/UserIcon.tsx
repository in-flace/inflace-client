'use client'

import { useRouter } from 'next/navigation'
import IconYoutube from '@/shared/assets/youtube.svg?react'
import { Avatar, AvatarImage, AvatarBadge } from '@/shared/ui/shadcn/avatar'
import { UserAvatarProps } from '../model/types'
import LogoIcon from '@/shared/assets/favicon.svg'
import { useAuthStore } from '@/entities/user'

export const UserIcon = ({ size, showBadge = false }: UserAvatarProps) => {
  const router = useRouter()
  const youtubeChannelProfileImage = useAuthStore(
    (state) => state.user?.userDetails?.profileImage
  )

  return (
    <Avatar size={size} className='cursor-pointer' onClick={() => router.push('/me/profile')}>
      {youtubeChannelProfileImage ? (
        <AvatarImage src={youtubeChannelProfileImage} />
      ) : (
        <LogoIcon className='size-full rounded-full' />
      )}
      {showBadge && (
        <AvatarBadge>
          <IconYoutube className='size-sm' />
        </AvatarBadge>
      )}
    </Avatar>
  )
}
