'use client'

import { useEffect } from 'react'

import { useCurrentUser } from '@/entities/user'
import { useOnboardingModal } from '@/features/onboarding/model/useOnboardingModal'
import { useAuthInit } from '../model/useAuthInit'

//레이아웃의 최상단에 위치, 화면이 새로고침 될 때마다 마운트
export function AuthInitializer() {
  useAuthInit()
  const { data: user } = useCurrentUser()

  useEffect(() => {
    if (user && !user.userDetails.isOnboardingCompleted) {
      useOnboardingModal.getState().open()
    }
  }, [user])

  return null
}
