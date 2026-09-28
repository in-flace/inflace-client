'use client'

import { useRouter } from 'next/navigation'
import IconYoutube from '@/shared/assets/youtube.svg?react'
import { Avatar, AvatarImage, AvatarBadge } from '@/shared/ui/shadcn/avatar'
import LogoIcon from '@/shared/assets/favicon.svg'
import { useCurrentUser } from '../model/useCurrentUser'

interface UserIconProps {
  size?: number
  showBadge?: boolean
}

export const UserIcon = ({ size, showBadge = false }: UserIconProps) => {
  const router = useRouter()
  const { data: user } = useCurrentUser()
  const youtubeChannelProfileImage = user?.userDetails.profileImage

  return (
    <Avatar
      size={size}
      className='cursor-pointer'
      onClick={() => router.push('/me/profile')}>
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
