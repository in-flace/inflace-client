'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useShallow } from 'zustand/react/shallow'
import { queryClient } from '@/shared/lib/queryClient'
import {
  CURRENT_USER_QUERY_KEY,
  isLoggedIn,
  useAuthStore,
  useCurrentUser,
} from '@/entities/user'

// 토큰 상태는 Zustand, 서버의 사용자 정보는 React Query에서 가져온다.
export function useAuth() {
  const router = useRouter()

  const { loggedIn, isInitializing } = useAuthStore(
    useShallow((s) => ({
      loggedIn: isLoggedIn(s),
      isInitializing: s.isInitializing,
    }))
  )
  const { data: user, isLoading: isUserLoading } = useCurrentUser()

  const logout = useCallback(async () => {
    const { accessToken } = useAuthStore.getState()
    useAuthStore.getState().reset()
    queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY_KEY })

    try {
      await fetch('/auth/logout', {
        method: 'POST',
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      })
    } catch {
      // 쿠키 삭제 실패해도 클라이언트 상태는 이미 초기화됨
    } finally {
      router.replace('/')
    }
  }, [router])

  return {
    isLoggedIn: loggedIn,
    isInitializing,
    isUserLoading,
    user: user ?? null,
    logout,
  }
}
