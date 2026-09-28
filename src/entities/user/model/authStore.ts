import { create } from 'zustand'

import type { AuthState } from './types'

// access token과 인증 초기화 상태만 메모리에 보관
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isInitializing: true,
  setAccessToken: (accessToken) => set({ accessToken }),
  reset: () => set({ accessToken: null }),
  setInitializing: (value) => set({ isInitializing: value }),
}))

export const isLoggedIn = (state: AuthState) => !!state.accessToken
