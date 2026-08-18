import { create } from 'zustand'

import { trackEvent } from '@/shared/analytics'
import type { LoginModalState } from './types'

/* 모달을 여는 순간 이벤트를 발행한다.
 * 호출부마다 따로 계측하면 새 진입점이 생겼을 때 누락되기 쉽다. */
export const useLoginModal = create<LoginModalState>((set) => ({
  isOpen: false,
  open: (trigger) => {
    trackEvent({ event: 'login_modal_opened', trigger })
    set({ isOpen: true })
  },
  close: () => set({ isOpen: false }),
}))
