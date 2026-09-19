'use client'

import dynamic from 'next/dynamic'

import { useLoginModal } from '@/features/auth/model/useLoginModal'
import { useYoutubeConnectModal } from '@/features/channelConnect/model/useYoutubeConnectModal'
import { useOnboardingModal } from '@/features/onboarding/model/useOnboardingModal'

const LoginModal = dynamic(
  () => import('@/widgets/auth/ui/LoginModal').then((m) => m.LoginModal),
  { ssr: false }
)
const YoutubeConnectModal = dynamic(
  () =>
    import('@/widgets/auth/ui/YoutubeConnectModal').then(
      (m) => m.YoutubeConnectModal
    ),
  { ssr: false }
)
const OnboardingModal = dynamic(
  () =>
    import('@/widgets/onboarding/ui/OnboardingModal').then(
      (m) => m.OnboardingModal
    ),
  { ssr: false }
)

export function GlobalModalLayer() {
  const loginOpen = useLoginModal((state) => state.isOpen)
  const youtubeConnectOpen = useYoutubeConnectModal((state) => state.isOpen)
  const onboardingOpen = useOnboardingModal((state) => state.isOpen)

  return (
    <>
      {loginOpen && <LoginModal />}
      {youtubeConnectOpen && <YoutubeConnectModal />}
      {onboardingOpen && <OnboardingModal />}
    </>
  )
}
