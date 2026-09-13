import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

import { useAuthStore } from '@/entities/user'
import { mockAccessToken, mockUser } from '@/entities/user/mock/mockUser'
import { useLoginModal } from './useLoginModal'
import { useRequireAuth } from './useRequireAuth'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}))

describe('useRequireAuth', () => {
  beforeEach(() => {
    useAuthStore.getState().reset()
    useLoginModal.setState({ isOpen: false })
    vi.clearAllMocks()
  })

  it('인증됨 + 초기화 완료 시 모달을 열지 않는다', () => {
    useAuthStore.setState({
      accessToken: mockAccessToken,
      user: mockUser,
      isInitializing: false,
    })

    renderHook(() => useRequireAuth())

    expect(useLoginModal.getState().isOpen).toBe(false)
  })

  it('미인증 + 초기화 완료 시 로그인 모달을 연다', async () => {
    useAuthStore.setState({
      accessToken: null,
      user: null,
      isInitializing: false,
    })

    renderHook(() => useRequireAuth())

    await waitFor(() => {
      expect(useLoginModal.getState().isOpen).toBe(true)
    })
  })

  it('초기화 중일 때 모달을 열지 않는다', () => {
    useAuthStore.setState({
      accessToken: null,
      user: null,
      isInitializing: true,
    })

    renderHook(() => useRequireAuth())

    expect(useLoginModal.getState().isOpen).toBe(false)
  })

  it('isInitializing이 true → false로 전환 시 미인증이면 로그인 모달을 연다', async () => {
    useAuthStore.setState({
      accessToken: null,
      user: null,
      isInitializing: true,
    })

    renderHook(() => useRequireAuth())
    expect(useLoginModal.getState().isOpen).toBe(false)

    act(() => {
      useAuthStore.getState().setInitializing(false)
    })

    await waitFor(() => {
      expect(useLoginModal.getState().isOpen).toBe(true)
    })
  })
})
