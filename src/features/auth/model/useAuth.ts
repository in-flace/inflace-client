'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useShallow } from 'zustand/react/shallow'
import { isLoggedIn, useAuthStore } from '@/entities/user'

//로그인 정보(access token, 유저 정보 등)를 entities/user의 authStore를 통해 가져와서 사용
export function useAuth() {
  const router = useRouter()

  const { loggedIn, user, isInitializing } = useAuthStore(
    useShallow((s) => ({
      loggedIn: isLoggedIn(s),
      user: s.user,
      isInitializing: s.isInitializing,
    }))
  )

  const logout = useCallback(async () => {
    useAuthStore.getState().reset()
    try {
      await fetch('/auth/logout', { method: 'POST' })
    } catch {
      // 쿠키 삭제 실패해도 클라이언트 상태는 이미 초기화됨
    } finally {
      router.replace('/')
    }
  }, [router])

  return {
    isLoggedIn: loggedIn,
    isInitializing,
    user,
    logout,
  }
}
