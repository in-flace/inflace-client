import { create } from 'zustand'

import type { AuthState } from './types'

//access token, 유저 정보, 초기화 상태를 메모리에 보관
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isInitializing: true,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  reset: () => set({ accessToken: null, user: null }),
  setInitializing: (value) => set({ isInitializing: value }),
}))

export const isLoggedIn = (state: AuthState) => !!state.accessToken
