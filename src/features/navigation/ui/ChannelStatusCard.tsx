'use client'

import { useShallow } from 'zustand/react/shallow'
import { isLoggedIn, useAuthStore } from '@/shared/api/authStore'
import { UserIcon } from '@/features/userStatus/ui/UserIcon'

import { Button } from '@/shared/ui/button'
import IconYoutube from '@/shared/assets/youtube.svg'
import { useLoginModal } from '@/features/auth/model/useLoginModal'
import { useYoutubeConnectModal } from '@/features/auth/model/useYoutubeConnectModal'

// 젝트 광고 기간 동안 플랜 업그레이드 버튼 노출 중단 — 임시 주석 처리
// import IconLock from '@/shared/assets/unlock-filled-bold.svg'

/* 사이드바에 표시되는 유저의 상태 (유튜브 채널 정보, 현재 플랜 등) */
export const ChannelStatusCard = () => {
  /* 유저의 정보를 불러옵니다. */
  const { loggedIn, plan, userChannelDetails } = useAuthStore(
    useShallow((state) => ({
      loggedIn: isLoggedIn(state),
      plan: state.user?.userDetails.plan,
      userChannelDetails: state.user?.userChannelDetails,
    }))
  )

  /*  유튜브 채널 연동 여부를 채널 정보 존재 유무로 확인합니다. */
  const isChannelConnected = loggedIn && Boolean(userChannelDetails)

  /* 채널 미연동 시 연동하기 버튼을 누르면 모달이 열립니다. */
  const openLoginModal = useLoginModal((s) => s.open)
  const openYoutubeConnectModal = useYoutubeConnectModal((s) => s.open)

  const openModal = loggedIn ? openYoutubeConnectModal : openLoginModal

  if (isChannelConnected) {
    /* 로그인 상태일 때 랜더링 되는 카드 */
    return (
      <div className='flex h-fit w-full flex-col items-center gap-12 rounded-10 border border-stroke-border-neutral-default bg-background-gray-default p-12'>
        <div className='flex h-fit w-full items-center gap-12'>
          {/* 채널 아이콘 */}
          <UserIcon size={38} />

          <div className='flex h-fit w-full min-w-0 flex-1 flex-col gap-6'>
            {/* 채널 이름 */}
            <p className='truncate text-noto-label-sm-normal text-text-and-icon-default'>
              {userChannelDetails?.youtubeChannelName}
            </p>

            {/* 플랜 표시 */}
            <p className='text-noto-label-sm-bold text-brand-primary'>
              {plan?.toLocaleUpperCase() ?? 'Free'}
            </p>
          </div>
        </div>

        {/* 플랜 업그레이드 버튼 — 젝트 광고 기간 동안 노출 중단
        {plan !== 'GROWTH' && (
          <Button
            color='primary'
            variant='filled'
            size='xs'
            className='h-fit w-full'
            rightIcon={<IconLock />}>
            플랜 업그레이드
          </Button>
        )}
        */}
      </div>
    )
  }

  /* 로그인 상태가 아니거나 채널 미연동 상태일 때 랜더링 되는 카드 */
  return (
    <div className='flex h-fit w-full items-center justify-between gap-12 rounded-10 border border-stroke-border-neutral-default bg-background-gray-default p-12'>
      {/* 미연동 상태라 로고를 흐리게 처리한다 */}
      <div className='flex size-[4.2rem] shrink-0 items-center justify-center rounded-full bg-background-gray-stronger'>
        {/* viewBox가 35 정사각형이라 CSS로 28x20을 주면 preserveAspectRatio가
         * 높이 기준으로 축소한다. 로고가 28x20이 되도록 정사각 프레임을 역산한다. */}
        <IconYoutube className='size-[3.424rem] opacity-40' />
      </div>

      <div className='flex h-fit min-w-0 flex-1 items-center justify-between gap-12'>
        <span className='text-noto-label-sm-normal text-text-and-icon-default'>
          채널 미연동
        </span>
        <Button
          color='primary'
          variant='filled'
          size='xs'
          onClick={() => openModal('channel_status')}>
          연동하기
        </Button>
      </div>
    </div>
  )
}
