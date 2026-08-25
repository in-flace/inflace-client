import { create } from 'zustand'

import type { InquiryPanelState } from './types'

export const useInquiryPanel = create<InquiryPanelState>((set) => ({
  isOpen: false,
  isSubmitting: false,
  open: () => set({ isOpen: true }),

  /* 전송 중에는 닫히지 않는다. 응답 전에 닫으면 접수됐는지 알 방법이 없다.
   *
   * 이 규칙을 스토어에 둔 이유는 닫는 경로가 셋이기 때문이다 —
   * ESC, 패널의 닫기 버튼, 그리고 진입점 버튼(X). 호출부마다 조건을 걸면
   * 한 곳만 빠뜨려도 뚫린다(실제로 진입점 버튼이 그랬다). */
  close: () => set((s) => (s.isSubmitting ? s : { isOpen: false })),
  toggle: () => set((s) => (s.isSubmitting ? s : { isOpen: !s.isOpen })),

  setSubmitting: (value) => set({ isSubmitting: value }),
}))
