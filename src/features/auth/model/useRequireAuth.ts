'use client'

import { useEffect } from 'react'

import { useAuth } from './useAuth'
import { useLoginModal } from './useLoginModal'

export function useRequireAuth() {
  const { isLoggedIn, isInitializing } = useAuth()
  const open = useLoginModal((s) => s.open)

  // 미로그인 상태가 확인되면 페이지 이동 없이 로그인 모달 오픈
  useEffect(() => {
    if (!isInitializing && !isLoggedIn) {
      open('protected_redirect')
    }
  }, [isInitializing, isLoggedIn, open])

  return { isLoggedIn, isInitializing }
}
