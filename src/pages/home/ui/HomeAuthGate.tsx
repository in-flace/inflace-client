'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/features/auth/model/useAuth'
import { useLoginModal } from '@/features/auth/model/useLoginModal'
// import { useGoogleAuthNoticeAutoOpen } from '@/features/googleAuthNotice'

function SearchParamsHandler({
  isInitializing,
  isLoggedIn,
}: {
  isInitializing: boolean
  isLoggedIn: boolean
}) {
  const searchParams = useSearchParams()
  const openLoginModal = useLoginModal((s) => s.open)

  // proxy.ts가 보호 경로 접근을 /?from=protected로 리다이렉트하면 로그인 모달 오픈
  useEffect(() => {
    if (
      !isInitializing &&
      !isLoggedIn &&
      searchParams?.get('from') === 'protected'
    ) {
      openLoginModal()
    }
  }, [isInitializing, isLoggedIn, searchParams, openLoginModal])

  return null
}

/* 로그인 여부에 따른 리다이렉트 및 snap 스크롤 클래스 토글을 담당하는 클라이언트 아일랜드.
 * HomePage의 정적 마크업(서버 컴포넌트)은 항상 먼저 렌더링되고,
 * 이 컴포넌트는 그 위에서 인증 상태에 따른 부수효과만 처리한다.
 */
export function HomeAuthGate() {
  const router = useRouter()
  const { isLoggedIn, isInitializing } = useAuth()

  useEffect(() => {
    if (!isInitializing && isLoggedIn) {
      router.replace('/main')
    }
  }, [isInitializing, isLoggedIn, router])

  /* Google OAuth 앱 검수가 승인되어 미인증 앱 경고 화면이 더 이상 노출되지 않으므로
   * 사전 안내 모달의 자동 노출을 중단한다.
   * 재심사 등으로 경고가 다시 노출되면 아래 호출만 되살리면 된다.
   * 모달 컴포넌트(widgets/googleAuthNotice)와 스토어는 그대로 유지한다. */
  // useGoogleAuthNoticeAutoOpen({
  //   isReady: !isInitializing && !isLoggedIn,
  // })

  /* auth 초기화 완료 후 snap 클래스를 추가하도록 함
   * isInitializing 중에 snap을 활성화하면 컨텐츠 렌더 시점에 snap-start로 강제 스크롤됨
   * 로딩 중 스클롤을 인식해 화면 최하단으로 랜더링 되는 것을 방지함.
   */
  useEffect(() => {
    if (isInitializing || isLoggedIn) return
    document.documentElement.classList.add('snap-landing')
    const footer = document.querySelector('footer')
    footer?.classList.add('snap-start')
    return () => {
      document.documentElement.classList.remove('snap-landing')
      footer?.classList.remove('snap-start')
    }
  }, [isInitializing, isLoggedIn])

  return (
    <Suspense fallback={null}>
      <SearchParamsHandler
        isInitializing={isInitializing}
        isLoggedIn={isLoggedIn}
      />
    </Suspense>
  )
}
