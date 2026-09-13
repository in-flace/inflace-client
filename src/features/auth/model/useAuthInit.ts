'use client'

import { useEffect } from 'react'

import { useOnboardingModal } from '@/features/onboarding/model/useOnboardingModal'
import { useAuthStore, fetchCurrentUser } from '@/entities/user'

//화면 새로고침 시 실행되는 함수
export function useAuthInit() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    const { setAuth, setInitializing } = useAuthStore.getState()

    async function init() {
      try {
        const res = await fetch('/auth/refresh', { method: 'POST' })
        if (!res.ok) return

        const { accessToken } = await res.json()
        setAuth(accessToken, null)

        const user = await fetchCurrentUser()
        setAuth(accessToken, user)

        if (!user.userDetails.isOnboardingCompleted) {
          useOnboardingModal.getState().open()
        }
      } catch {
        // RT 쿠키 없거나 만료 → 비로그인 상태 유지
      } finally {
        setInitializing(false)
      }
    }

    init()
  }, [])
}
