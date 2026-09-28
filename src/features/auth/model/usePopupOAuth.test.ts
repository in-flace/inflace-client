import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { CURRENT_USER_QUERY_KEY, useAuthStore } from '@/entities/user'
import { mockAccessToken, mockUser } from '@/entities/user/mock/mockUser'
import { queryClient } from '@/shared/lib/queryClient'
import { useLoginModal } from './useLoginModal'
import { usePopupOAuth } from './usePopupOAuth'

/* 계측은 별도 테스트에서 다룬다. 여기서는 팝업 동작만 본다. */
vi.mock('@/shared/analytics', () => ({ trackEvent: vi.fn() }))

const mockReplace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

const CONFIG = {
  apiPath: '/auth/google',
  popupName: 'google-login',
  provider: 'google',
} as const

const mockPopup = {
  closed: false,
  close: vi.fn(),
}

function dispatchAuthMessage(data: Record<string, unknown>) {
  window.dispatchEvent(
    new MessageEvent('message', {
      origin: window.location.origin,
      source: mockPopup as unknown as Window,
      data,
    })
  )
}

describe('usePopupOAuth', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    queryClient.clear()
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

  it('AUTH_SUCCESS 메시지 수신 시 인증 상태를 저장하고 /main으로 이동한다', () => {
    const { result } = renderHook(() => usePopupOAuth(CONFIG))
    act(() => {
      result.current.handleClick()
    })

    act(() => {
      dispatchAuthMessage({
        type: 'AUTH_SUCCESS',
        accessToken: mockAccessToken,
        user: mockUser,
      })
    })

    expect(useAuthStore.getState().accessToken).toBe(mockAccessToken)
    expect(queryClient.getQueryData(CURRENT_USER_QUERY_KEY)).toEqual(mockUser)
    expect(mockReplace).toHaveBeenCalledWith('/main')
  })

  it('AUTH_SUCCESS 메시지 수신 시 loginModal을 닫는다', () => {
    const { result } = renderHook(() => usePopupOAuth(CONFIG))
    act(() => {
      result.current.handleClick()
    })

    act(() => {
      dispatchAuthMessage({
        type: 'AUTH_SUCCESS',
        accessToken: mockAccessToken,
        user: mockUser,
      })
    })

    expect(useLoginModal.getState().isOpen).toBe(false)
  })

  it('AUTH_ERROR 메시지 수신 시 error 상태가 설정되고 isLoading이 false가 된다', () => {
    const { result } = renderHook(() => usePopupOAuth(CONFIG))
    act(() => {
      result.current.handleClick()
    })

    act(() => {
      dispatchAuthMessage({
        type: 'AUTH_ERROR',
        error: '인증에 실패했습니다.',
      })
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
          source: mockPopup as unknown as Window,
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

  it('OAuth 팝업이 아닌 창에서 온 메시지는 무시한다', () => {
    const { result } = renderHook(() => usePopupOAuth(CONFIG))
    act(() => {
      result.current.handleClick()
    })

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: window.location.origin,
          source: window,
          data: {
            type: 'AUTH_SUCCESS',
            accessToken: mockAccessToken,
            user: mockUser,
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
