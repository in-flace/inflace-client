import { describe, it, expect, beforeEach, vi } from 'vitest'

import { trackEvent } from '@/shared/analytics'
import { useLoginModal } from './useLoginModal'

vi.mock('@/shared/analytics', () => ({ trackEvent: vi.fn() }))

describe('useLoginModal', () => {
  beforeEach(() => {
    useLoginModal.getState().close()
    vi.clearAllMocks()
  })

  it('초기 상태: isOpen이 false다', () => {
    expect(useLoginModal.getState().isOpen).toBe(false)
  })

  it('open() 호출 시 isOpen이 true가 된다', () => {
    useLoginModal.getState().open('header')
    expect(useLoginModal.getState().isOpen).toBe(true)
  })

  /* 전환율 분모가 이 이벤트로 집계된다. 진입 경로가 빠지면 어느 CTA가
   * 가입을 만드는지 알 수 없고, 세션 만료로 강제로 열린 건도 걸러낼 수 없다. */
  it('open() 시 진입 경로와 함께 이벤트를 보낸다', () => {
    useLoginModal.getState().open('hero_cta')

    expect(trackEvent).toHaveBeenCalledWith({
      event: 'login_modal_opened',
      trigger: 'hero_cta',
    })
  })

  it('세션 만료로 열린 경우 다른 경로 값으로 구분된다', () => {
    useLoginModal.getState().open('session_expired')

    expect(trackEvent).toHaveBeenCalledWith({
      event: 'login_modal_opened',
      trigger: 'session_expired',
    })
  })

  it('close() 호출 시 isOpen이 false가 된다', () => {
    useLoginModal.getState().open('header')
    useLoginModal.getState().close()
    expect(useLoginModal.getState().isOpen).toBe(false)
  })

  it('open() → close() 전환이 정상 동작한다', () => {
    useLoginModal.getState().open('header')
    expect(useLoginModal.getState().isOpen).toBe(true)

    useLoginModal.getState().close()
    expect(useLoginModal.getState().isOpen).toBe(false)
  })
})
