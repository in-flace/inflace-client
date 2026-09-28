import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

import { useAuthStore } from '@/entities/user'
import { mockAccessToken } from '@/entities/user/mock/mockUser'
import { queryClient } from '@/shared/lib/queryClient'
import { useLoginModal } from './useLoginModal'
import { useRequireAuth } from './useRequireAuth'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}))

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children)
}

function renderUseRequireAuth() {
  return renderHook(() => useRequireAuth(), { wrapper })
}

describe('useRequireAuth', () => {
  beforeEach(() => {
    useAuthStore.getState().reset()
    queryClient.clear()
    useLoginModal.setState({ isOpen: false })
    vi.clearAllMocks()
  })

  it('인증됨 + 초기화 완료 시 모달을 열지 않는다', () => {
    useAuthStore.setState({
      accessToken: mockAccessToken,
      isInitializing: false,
    })

    renderUseRequireAuth()

    expect(useLoginModal.getState().isOpen).toBe(false)
  })

  it('미인증 + 초기화 완료 시 로그인 모달을 연다', async () => {
    useAuthStore.setState({
      accessToken: null,
      isInitializing: false,
    })

    renderUseRequireAuth()

    await waitFor(() => {
      expect(useLoginModal.getState().isOpen).toBe(true)
    })
  })

  it('초기화 중일 때 모달을 열지 않는다', () => {
    useAuthStore.setState({
      accessToken: null,
      isInitializing: true,
    })

    renderUseRequireAuth()

    expect(useLoginModal.getState().isOpen).toBe(false)
  })

  it('isInitializing이 true → false로 전환 시 미인증이면 로그인 모달을 연다', async () => {
    useAuthStore.setState({
      accessToken: null,
      isInitializing: true,
    })

    renderUseRequireAuth()
    expect(useLoginModal.getState().isOpen).toBe(false)

    act(() => {
      useAuthStore.getState().setInitializing(false)
    })

    await waitFor(() => {
      expect(useLoginModal.getState().isOpen).toBe(true)
    })
  })
})
