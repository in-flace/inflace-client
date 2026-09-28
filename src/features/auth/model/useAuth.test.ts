import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

import { CURRENT_USER_QUERY_KEY, useAuthStore } from '@/entities/user'
import { mockUser } from '@/entities/user/mock/mockUser'
import { queryClient } from '@/shared/lib/queryClient'
import { useAuth } from './useAuth'

const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children)
}

function renderUseAuth() {
  return renderHook(() => useAuth(), { wrapper })
}

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.getState().reset()
    useAuthStore.getState().setInitializing(false)
    queryClient.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accessToken이 있을 때 isLoggedIn가 true다', () => {
    useAuthStore.setState({
      accessToken: 'token',
      isInitializing: false,
    })
    const { result } = renderUseAuth()
    expect(result.current.isLoggedIn).toBe(true)
  })

  it('accessToken이 없을 때 isLoggedIn가 false다', () => {
    useAuthStore.setState({
      accessToken: null,
      isInitializing: false,
    })
    const { result } = renderUseAuth()
    expect(result.current.isLoggedIn).toBe(false)
  })

  it('isInitializing이 authStore.isInitializing을 반영한다', () => {
    useAuthStore.setState({
      isInitializing: true,
      accessToken: null,
    })
    const { result } = renderUseAuth()
    expect(result.current.isInitializing).toBe(true)
  })

  it('user가 currentUser 쿼리 캐시를 반영한다', () => {
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, mockUser)
    useAuthStore.setState({
      accessToken: 'token',
      isInitializing: false,
    })
    const { result } = renderUseAuth()
    expect(result.current.user).toEqual(mockUser)
  })

  it('logout 호출 시 authStore가 reset된다', async () => {
    useAuthStore.setState({
      accessToken: 'token',
      isInitializing: false,
    })
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, mockUser)
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response())

    const { result } = renderUseAuth()
    await act(async () => {
      await result.current.logout()
    })

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(queryClient.getQueryData(CURRENT_USER_QUERY_KEY)).toBeUndefined()
  })

  it('logout 호출 시 /auth/logout으로 POST 요청을 보낸다', async () => {
    useAuthStore.getState().setAccessToken('token')
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response())

    const { result } = renderUseAuth()
    await act(async () => {
      await result.current.logout()
    })

    expect(fetchSpy).toHaveBeenCalledWith('/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer token' },
    })
  })

  it('logout 호출 시 /로 이동한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response())

    const { result } = renderUseAuth()
    await act(async () => {
      await result.current.logout()
    })

    expect(mockReplace).toHaveBeenCalledWith('/')
  })

  it('logout 시 fetch 실패해도 에러가 전파되지 않고 /로 이동한다', async () => {
    useAuthStore.setState({
      accessToken: 'token',
      isInitializing: false,
    })
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new Error('Network error')
    )

    const { result } = renderUseAuth()
    await expect(
      act(async () => {
        await result.current.logout()
      })
    ).resolves.not.toThrow()

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(mockReplace).toHaveBeenCalledWith('/')
  })
})
