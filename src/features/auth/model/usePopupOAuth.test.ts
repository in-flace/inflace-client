import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useAuthStore } from '@/shared/api'
import { useLoginModal } from './useLoginModal'
import { usePopupOAuth } from './usePopupOAuth'

/* 계측은 별도 테스트에서 다룬다. 여기서는 팝업 동작만 본다. */
vi.mock('@/shared/analytics', () => ({ trackEvent: vi.fn() }))

const CONFIG = {
  apiPath: '/auth/google',
  popupName: 'google-login',
  provider: 'google',
} as const

const mockPopup = {
  closed: false,
  close: vi.fn(),
}

describe('usePopupOAuth', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useAuthStore.getState().reset()
    useAuthStore.getState().setInitializing(false)
    useLoginModal.setState({ isOpen: true })
    mockPopup.closed = false
    vi.spyOn(window, 'open').mockReturnValue(mockPopup as unknown as Window)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('handleClick 호출 시 window.open이 올바른 인자로 호출된다', () => {
    const { result } = renderHook(() => usePopupOAuth(CONFIG))

    act(() => {
      result.current.handleClick()
    })

    expect(window.open).toHaveBeenCalledWith(
      CONFIG.apiPath,
      CONFIG.popupName,
      expect.stringContaining('width=500')
    )
    expect(window.open).toHaveBeenCalledWith(
      CONFIG.apiPath,
      CONFIG.popupName,
      expect.stringContaining('height=600')
    )
  })

  it('handleClick 호출 후 isLoading이 true가 된다', () => {
    const { result } = renderHook(() => usePopupOAuth(CONFIG))

    act(() => {
      result.current.handleClick()
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('팝업이 차단될 때(window.open이 null 반환) error 상태가 설정된다', () => {
    vi.spyOn(window, 'open').mockReturnValue(null)

    const { result } = renderHook(() => usePopupOAuth(CONFIG))

    act(() => {
      result.current.handleClick()
    })

    expect(result.current.error).toContain('팝업이 차단')
    expect(result.current.isLoading).toBe(false)
  })

  it('AUTH_SUCCESS 메시지 수신 시 window.location.href가 "/"로 이동한다', () => {
    const { result } = renderHook(() => usePopupOAuth(CONFIG))
    act(() => {
      result.current.handleClick()
    })

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: window.location.origin,
          data: { type: 'AUTH_SUCCESS' },
        })
      )
    })

    expect(window.location.href).toBe('http://localhost:3000/')
  })

  it('AUTH_SUCCESS 메시지 수신 시 loginModal은 열린 채로 유지된다', () => {
    const { result } = renderHook(() => usePopupOAuth(CONFIG))
    act(() => {
      result.current.handleClick()
    })

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: window.location.origin,
          data: { type: 'AUTH_SUCCESS' },
        })
      )
    })

    // AUTH_SUCCESS는 window.location.href로 페이지를 이동하며 모달을 직접 닫지 않는다
    expect(useLoginModal.getState().isOpen).toBe(true)
  })

  it('AUTH_ERROR 메시지 수신 시 error 상태가 설정되고 isLoading이 false가 된다', () => {
    const { result } = renderHook(() => usePopupOAuth(CONFIG))
    act(() => {
      result.current.handleClick()
    })

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: window.location.origin,
          data: { type: 'AUTH_ERROR', error: '인증에 실패했습니다.' },
        })
      )
    })

    expect(result.current.error).toBe('인증에 실패했습니다.')
    expect(result.current.isLoading).toBe(false)
  })

  it('다른 origin의 메시지는 무시한다', () => {
    const { result } = renderHook(() => usePopupOAuth(CONFIG))
    act(() => {
      result.current.handleClick()
    })

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'https://evil.example.com',
          data: {
            type: 'AUTH_SUCCESS',
            accessToken: 'stolen-token',
            user: null,
          },
        })
      )
    })

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('팝업이 닫히면 isLoading이 false가 된다', () => {
    const { result } = renderHook(() => usePopupOAuth(CONFIG))
    act(() => {
      result.current.handleClick()
    })

    expect(result.current.isLoading).toBe(true)

    act(() => {
      mockPopup.closed = true
      vi.advanceTimersByTime(600)
    })

    expect(result.current.isLoading).toBe(false)
  })
})
