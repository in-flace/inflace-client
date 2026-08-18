'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { trackEvent } from '@/shared/analytics'
import type { PopupOAuthConfig } from './types'

const POPUP_WIDTH = 500
const POPUP_HEIGHT = 600
const POPUP_POLL_INTERVAL = 500

export function usePopupOAuth({
  apiPath,
  popupName,
  provider,
}: PopupOAuthConfig) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const popupRef = useRef<Window | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 팝업 닫힘 감지
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // 로그인 모달이 닫힐 때 호출 => 로그인 과정 취소
  const reset = useCallback(() => {
    stopPolling()
    if (popupRef.current && !popupRef.current.closed) {
      try {
        popupRef.current.close()
      } catch {}
    }
    popupRef.current = null
    setIsLoading(false)
    setError(null)
  }, [stopPolling])

  // OAuth 팝업에서 postMessage로 전달된 인증 결과 처리
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      /* LoginModal은 구글·유튜브용으로 이 훅을 두 개 만들고, 두 인스턴스가
       * 모두 window의 message를 듣는다. 걸러내지 않으면 한 번의 로그인에
       * 양쪽 핸들러가 다 반응해 이벤트가 두 번 발행되고 제공자도 잘못 붙는다.
       * 팝업을 실제로 연 인스턴스만 처리한다. */
      if (!popupRef.current) return

      const { type, error: authError, isNewUser, user } = event.data

      if (type === 'AUTH_SUCCESS') {
        stopPolling()
        setIsLoading(false)

        /* 반드시 리다이렉트 전에 보낸다. window.location.href가 실행되면
         * 페이지가 통째로 다시 로드되어 dataLayer가 초기화되고, isNewUser는
         * 로그인 응답에만 있어 이후에는 다시 얻을 수 없다. */
        trackEvent({
          event: isNewUser ? 'sign_up' : 'login',
          method: provider,
          user_id: user?.userDetails?.id ?? '',
        })

        window.location.href = '/'
      } else if (type === 'AUTH_ERROR') {
        stopPolling()
        setError(authError || '로그인에 실패했습니다.')
        setIsLoading(false)
        trackEvent({
          event: 'login_failed',
          method: provider,
          reason: authError || 'unknown',
        })
      }
    },
    [stopPolling, provider]
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // 훅 언마운트 시 인터벌 누수 방지
  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  const handleClick = () => {
    setError(null)
    setIsLoading(true)
    trackEvent({ event: 'login_provider_click', method: provider })

    const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2
    const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2

    const popup = window.open(
      apiPath,
      popupName,
      `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top}`
    )

    if (!popup) {
      setError('팝업이 차단되었습니다. 팝업 차단을 해제해 주세요.')
      setIsLoading(false)
      trackEvent({ event: 'login_popup_blocked', method: provider })
      return
    }

    popupRef.current = popup

    // postMessage가 오지 않는 경우(사용자가 팝업을 직접 닫는 경우)를 감지
    pollRef.current = setInterval(() => {
      if (popupRef.current?.closed) {
        stopPolling()
        setIsLoading(false)
        popupRef.current = null
        /* 성공/실패 메시지 없이 창만 닫힌 경우다. 구글 화면에서의 이탈을
         * 이 이벤트로 구분한다. */
        trackEvent({ event: 'login_popup_closed', method: provider })
      }
    }, POPUP_POLL_INTERVAL)
  }

  return { isLoading, error, handleClick, reset }
}
