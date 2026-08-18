import { useMutation } from '@tanstack/react-query'

import { trackEvent } from '@/shared/analytics'
import type { OnboardingCompletionMethod } from '@/shared/analytics'

import { postOnboarding } from '../api/onboardingApi'
import type { UserRole, Need } from './types'

interface CompleteOnboardingVariables {
  roles: UserRole[]
  needs: Need[]
  /* 어떤 경로로 끝냈는지. 서버로 보내지 않고 계측에만 쓴다. */
  method: OnboardingCompletionMethod
}

/* 완료 이벤트는 서버 저장이 성공한 경우에만 보낸다.
 * 화면은 실패해도 모달을 닫으므로(OnboardingActionButtons의 .finally(close))
 * UI 기준으로 세면 실제보다 부풀려진다. */
export const useOnboarding = () =>
  useMutation({
    mutationFn: ({ roles, needs }: CompleteOnboardingVariables) =>
      postOnboarding({ roles, needs }),
    onSuccess: (_data, { method }) => {
      trackEvent({ event: 'onboarding_completed', method })
    },
  })
