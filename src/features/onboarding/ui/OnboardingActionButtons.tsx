import { useConnectChannel, YoutubeConnectActions } from '@/features/auth'
import {
  useOnboarding,
  useOnboardingModal,
  UserRole,
  Need,
} from '@/features/onboarding'
import { Button } from '@/shared/ui/button'
import { CHANNEL_ANALYSIS_VALUE } from '../model/optionsStep02'

import IconRightArrow from '@/shared/assets/rightwards-arrow-bold.svg'

export function OnboardingActionButtons() {
  const close = useOnboardingModal((s) => s.close)
  const { selections } = useOnboardingModal()

  const { mutateAsync: completeOnboarding, isPending: isOnboardingPending } =
    useOnboarding()
  const { mutateAsync: connectChannel, isPending: isConnectPending } =
    useConnectChannel()

  const roles = selections[1] as UserRole[]
  const needs = selections[2] as Need[]

  const isPending = isOnboardingPending || isConnectPending
  const showYoutubeConnect =
    roles?.includes('YOUTUBER') || needs?.includes(CHANNEL_ANALYSIS_VALUE)

  // 유튜브 연동: 온보딩 완료 + 채널 연동 병렬 호출, 둘 다 끝나면 모달 close (채널 연동 실패는 무시)
  const handleConnectYoutube = async () => {
    await Promise.allSettled([
      completeOnboarding({ roles, needs, method: 'youtube_connect' }),
      connectChannel(),
    ])
    close()
  }

  // 나중에 할래요 / 대시보드 둘러보기: 온보딩 완료만 호출
  const handleComplete = () => {
    completeOnboarding({ roles, needs, method: 'skip' }).finally(close)
  }

  return (
    <>
      {showYoutubeConnect ? (
        <YoutubeConnectActions
          onConnect={handleConnectYoutube}
          onLater={handleComplete}
          isPending={isPending}
        />
      ) : (
        <Button
          color={'primary'}
          size={'lg'}
          variant={'filled'}
          onClick={handleComplete}
          rightIcon={<IconRightArrow />}
          className='ml-auto'>
          대시보드 둘러보기
        </Button>
      )}
    </>
  )
}
