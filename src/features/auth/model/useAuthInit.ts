'use client'

import { useEffect } from 'react'

import { useAuthStore } from '@/entities/user'

//화면 새로고침 시 실행되는 함수
export function useAuthInit() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    const { setAccessToken, setInitializing } = useAuthStore.getState()

    async function init() {
      try {
        const res = await fetch('/auth/refresh', { method: 'POST' })
        if (!res.ok) return

        const { accessToken } = await res.json()
        setAccessToken(accessToken)
      } catch {
        // RT 쿠키 없거나 만료 → 비로그인 상태 유지
      } finally {
        setInitializing(false)
      }
    }

    init()
  }, [])
}
