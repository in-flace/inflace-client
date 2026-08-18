import { create } from 'zustand'

import { trackEvent } from '@/shared/analytics'

import type { OnboardingModalState } from './types'

export const useOnboardingModal = create<OnboardingModalState>((set, get) => ({
  isOpen: false,
  step: 1,
  featureIndex: 0,
  selections: {}, //{[step]: value} 형태로 각 step 옵션 값 저장 / setSelection 참조
  /* 가입 직후 useAuthInit이 자동으로 연다. 온보딩 완료율의 분모가 된다. */
  open: () => {
    trackEvent({ event: 'onboarding_started' })
    set({ isOpen: true })
  },
  close: () => set({ isOpen: false }),
  nextStep: () => {
    const { step } = get()
    /* 마지막 단계에서는 더 넘어갈 곳이 없으므로 실제로 넘어간 경우만 센다.
     * step은 방금 끝낸 단계다. 단계별 통과 수가 있어야 어디서 이탈하는지 보인다. */
    if (step < 4) {
      trackEvent({ event: 'onboarding_step_completed', step })
    }
    set({ step: step < 4 ? step + 1 : step, featureIndex: 0 })
  },
  prevStep: () =>
    set((s) => ({ step: s.step >= 2 ? s.step - 1 : s.step, featureIndex: 0 })),
  nextFeature: () => set((s) => ({ featureIndex: s.featureIndex + 1 })),
  setSelection: (step, value) =>
    set((s) => ({ selections: { ...s.selections, [step]: value } })),
}))
