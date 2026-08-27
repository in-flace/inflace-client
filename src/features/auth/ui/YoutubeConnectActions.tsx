'use client'

import { SocialLoginButton } from './SocialLoginButton'
import YouTubeIcon from '@/shared/assets/youtube.svg'

interface YoutubeConnectActionsProps {
  onConnect: () => void
  onLater: () => void
  isPending?: boolean
  error?: Error | null
  pendingLabel?: string
}

export function YoutubeConnectActions({
  onConnect,
  onLater,
  isPending = false,
  error,
  pendingLabel = '연동 중...',
}: YoutubeConnectActionsProps) {
  return (
    <div className='flex min-h-80 w-full flex-col items-center gap-16'>
      <SocialLoginButton
        icon={<YouTubeIcon />}
        label={isPending ? pendingLabel : 'YouTube로 계속하기'}
        labelClassName='text-noto-label-lg-normal'
        onClick={onConnect}
        disabled={isPending}
        className='w-full'
      />

      {error && (
        <p className='text-noto-label-sm-normal text-destructive'>
          {error.message}
        </p>
      )}

      <button
        type='button'
        onClick={onLater}
        disabled={isPending}
        className='cursor-pointer text-noto-label-sm-normal text-text-and-icon-tertiary transition-colors hover:text-text-and-icon-primary disabled:pointer-events-none disabled:opacity-50'>
        나중에 할래요
      </button>
    </div>
  )
}
