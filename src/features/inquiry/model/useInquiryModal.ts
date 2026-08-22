import { create } from 'zustand'

import type { InquiryModalState } from './types'

export const useInquiryModal = create<InquiryModalState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
