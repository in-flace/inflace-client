import { create } from 'zustand'

import type { InquiryPanelState } from './types'

export const useInquiryPanel = create<InquiryPanelState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}))
