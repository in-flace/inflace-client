'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { PopupOAuthConfig } from './types'

const POPUP_WIDTH = 500
const POPUP_HEIGHT = 600
const POPUP_POLL_INTERVAL = 500

export function usePopupOAuth({
  apiPath,
  popupName,
  onSuccess,
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

      const { type, error: authError, isNewUser } = event.data

      if (type === 'AUTH_SUCCESS') {
        stopPolling()
        setIsLoading(false)
        /* 리다이렉트 전에 알린다. window.location.href가 실행되면 페이지가
         * 통째로 다시 로드되어 이 정보를 다시 얻을 방법이 없다. */
        onSuccess?.({ isNewUser: Boolean(isNewUser) })
        window.location.href = '/'
      } else if (type === 'AUTH_ERROR') {
        stopPolling()
        setError(authError || '로그인에 실패했습니다.')
        setIsLoading(false)
      }
    },
    [stopPolling, onSuccess]
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
      return
    }

    popupRef.current = popup

    // postMessage가 오지 않는 경우(사용자가 팝업을 직접 닫는 경우)를 감지
    pollRef.current = setInterval(() => {
      if (popupRef.current?.closed) {
        stopPolling()
        setIsLoading(false)
        popupRef.current = null
      }
    }, POPUP_POLL_INTERVAL)
  }

  return { isLoading, error, handleClick, reset }
}
