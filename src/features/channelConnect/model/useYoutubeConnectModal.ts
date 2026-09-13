import { create } from 'zustand'

import type { YoutubeConnectModalState } from './types'

export const useYoutubeConnectModal = create<YoutubeConnectModalState>(
  (set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
  })
)
