'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useLoginModal } from '@/features/auth'

// 외부 링크나 직접 URL 접근 시 홈으로 리다이렉트 + 모달 오픈하는 폴백 역할만 담당
export default function LoginPage() {
  const router = useRouter()
  const openModal = useLoginModal((s) => s.open)

  useEffect(() => {
    openModal('login_page')
    router.replace('/')
  }, [openModal, router])

  return null
}
