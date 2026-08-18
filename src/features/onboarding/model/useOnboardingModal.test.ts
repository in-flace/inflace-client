import { describe, it, expect, beforeEach, vi } from 'vitest'

import { trackEvent } from '@/shared/analytics'
import { useOnboardingModal } from './useOnboardingModal'

vi.mock('@/shared/analytics', () => ({ trackEvent: vi.fn() }))

/* 온보딩 완료율의 분모(started)와 단계별 이탈 지점(step_completed)이
 * 이 스토어에서 나온다. 빠지면 "어디서 떨어지는지"를 볼 수 없다. */

describe('useOnboardingModal 계측', () => {
  beforeEach(() => {
    useOnboardingModal.setState({ isOpen: false, step: 1, featureIndex: 0 })
    vi.clearAllMocks()
  })

  it('열 때 onboarding_started를 보낸다', () => {
    useOnboardingModal.getState().open()

    expect(trackEvent).toHaveBeenCalledWith({ event: 'onboarding_started' })
    expect(useOnboardingModal.getState().isOpen).toBe(true)
  })

  it('다음 단계로 갈 때 방금 끝낸 단계 번호를 보낸다', () => {
    useOnboardingModal.getState().nextStep()

    expect(trackEvent).toHaveBeenCalledWith({
      event: 'onboarding_step_completed',
      step: 1,
    })
    expect(useOnboardingModal.getState().step).toBe(2)
  })

  /* 마지막 단계에서는 더 넘어갈 곳이 없다. 그래도 이벤트를 보내면
   * 통과 수가 부풀려져 이탈 지점이 왜곡된다. */
  it('마지막 단계에서는 보내지 않는다', () => {
    useOnboardingModal.setState({ step: 4 })

    useOnboardingModal.getState().nextStep()

    expect(trackEvent).not.toHaveBeenCalled()
    expect(useOnboardingModal.getState().step).toBe(4)
  })

  it('이전 단계로 돌아갈 때는 보내지 않는다', () => {
    useOnboardingModal.setState({ step: 3 })

    useOnboardingModal.getState().prevStep()

    expect(trackEvent).not.toHaveBeenCalled()
    expect(useOnboardingModal.getState().step).toBe(2)
  })
})
