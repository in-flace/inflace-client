'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/shadcn/avatar'
import IconPlus from '@/shared/assets/plus-bold.svg'
import { Button } from '@/shared/ui/button'
import { formatDate } from '@/shared/lib/format'
import { useAuthStore } from '@/entities/user'
import { useChannelProfile } from '@/features/main/channelProfile'
import type { ChannelProfileDto } from '@/entities/main/channelProfile'
import { useDisconnectChannel, useYoutubeConnectModal } from '@/features/auth'
import { ChannelDisconnectModal } from './ChannelDisconnectModal'

export function LinkedChannelsForDeleteCard() {
  const { data: channel } = useChannelProfile()
  const channelId = useAuthStore(
    (s) => s.user?.userChannelDetails?.channelId ?? null
  )
  const [isDisconnectModalOpen, setDisconnectModalOpen] = useState(false)
  const { mutate: disconnectChannel, isPending: isDisconnecting } =
    useDisconnectChannel()
  const openYoutubeConnectModal = useYoutubeConnectModal((s) => s.open)

  function handleConfirmDisconnect() {
    if (channelId == null) return
    disconnectChannel(channelId, {
      onSuccess: () => setDisconnectModalOpen(false),
    })
  }

  return (
    <div className='flex w-full flex-col gap-24 rounded-16 bg-white p-32'>
      <div className='flex flex-col gap-8'>
        <h2 className='text-noto-title-md-bold text-text-and-icon-default'>
          연동된 유튜브 채널
        </h2>
        <p className='text-noto-body-xxs-normal text-text-and-icon-tertiary'>
          연동된 유튜브 채널들 중 분석을 진행할 채널을 선택해주세요.
        </p>
      </div>

      {channel ? (
        <ChannelRow
          channel={channel}
          onRequestDisconnect={() => setDisconnectModalOpen(true)}
        />
      ) : (
        <button
          type='button'
          onClick={openYoutubeConnectModal}
          className='flex w-full cursor-pointer items-center justify-center gap-6 rounded-6 border border-stroke-border-gray-default px-20 py-10 text-noto-label-lg-normal text-text-and-icon-tertiary'>
          <IconPlus className='size-[1.7rem]' />
          채널 연동하기
        </button>
      )}

      <ChannelDisconnectModal
        open={isDisconnectModalOpen}
        onClose={() => setDisconnectModalOpen(false)}
        onConfirm={handleConfirmDisconnect}
        isPending={isDisconnecting}
      />
    </div>
  )
}

function ChannelRow({
  channel,
  onRequestDisconnect,
}: {
  channel: ChannelProfileDto
  onRequestDisconnect: () => void
}) {
  const router = useRouter()
  const { year, month, day } = formatDate(channel.enteredAt)

  return (
    <div className='flex items-end gap-40 rounded-12 border border-stroke-border-gray-default bg-white p-32'>
      <div className='flex min-w-0 flex-1 items-start gap-24'>
        <Avatar className='size-[6rem] shrink-0'>
          <AvatarImage src={channel.profileImageUrl} alt={channel.name} />
          <AvatarFallback>{channel.name.slice(0, 2)}</AvatarFallback>
        </Avatar>

        <div className='flex min-w-0 flex-1 flex-col gap-24'>
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-12'>
              <span className='text-noto-label-lg-normal text-text-and-icon-default'>
                {channel.name}
              </span>
              <span className='rounded-full bg-[var(--primitivecolortrasparent-brand-deep-900-transparent-8)] px-12 py-6 text-noto-label-xs-thin text-text-and-icon-secondary'>
                # {channel.category.join(', ')}
              </span>
            </div>
            <span className='text-noto-label-xs-normal text-text-and-icon-secondary'>
              {channel.channelHandle}
            </span>
          </div>

          <div className='flex items-center'>
            <span className='pr-8 text-noto-body-xxs-normal text-text-and-icon-tertiary'>
              YouTube Analytics {`${year}.${month}.${day}`} 연동
            </span>
            <span
              aria-hidden='true'
              className='h-16 w-px bg-stroke-border-gray-stronger'
            />
            <button
              type='button'
              onClick={onRequestDisconnect}
              className='cursor-pointer px-8 py-4 text-noto-body-xxs-bold text-brand-secondary-weaker underline'>
              연동 해지
            </button>
          </div>
        </div>
      </div>

      <Button
        type='button'
        color='primary'
        variant='filled'
        size='sm'
        onClick={() => router.push('/main')}
        className='shrink-0'>
        대시보드 보기
      </Button>
    </div>
  )
}
