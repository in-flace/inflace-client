import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useAuthStore } from '@/entities/user'
import { mockUser } from '@/entities/user/mock/mockUser'
import { useAuth } from './useAuth'

const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.getState().reset()
    useAuthStore.getState().setInitializing(false)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accessToken이 있을 때 isLoggedIn가 true다', () => {
    useAuthStore.setState({
      accessToken: 'token',
      user: mockUser,
      isInitializing: false,
    })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isLoggedIn).toBe(true)
  })

  it('accessToken이 없을 때 isLoggedIn가 false다', () => {
    useAuthStore.setState({
      accessToken: null,
      user: null,
      isInitializing: false,
    })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isLoggedIn).toBe(false)
  })

  it('isInitializing이 authStore.isInitializing을 반영한다', () => {
    useAuthStore.setState({
      isInitializing: true,
      accessToken: null,
      user: null,
    })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isInitializing).toBe(true)
  })

  it('user가 authStore.user를 반영한다', () => {
    useAuthStore.setState({
      accessToken: 'token',
      user: mockUser,
      isInitializing: false,
    })
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toEqual(mockUser)
  })

  it('logout 호출 시 authStore가 reset된다', async () => {
    useAuthStore.setState({
      accessToken: 'token',
      user: mockUser,
      isInitializing: false,
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response())

    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.logout()
    })

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('logout 호출 시 /auth/logout으로 POST 요청을 보낸다', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response())

    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.logout()
    })

    expect(fetchSpy).toHaveBeenCalledWith('/auth/logout', { method: 'POST' })
  })

  it('logout 호출 시 /로 이동한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response())

    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.logout()
    })

    expect(mockReplace).toHaveBeenCalledWith('/')
  })

  it('logout 시 fetch 실패해도 에러가 전파되지 않고 /로 이동한다', async () => {
    useAuthStore.setState({
      accessToken: 'token',
      user: mockUser,
      isInitializing: false,
    })
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new Error('Network error')
    )

    const { result } = renderHook(() => useAuth())
    await expect(
      act(async () => {
        await result.current.logout()
      })
    ).resolves.not.toThrow()

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(mockReplace).toHaveBeenCalledWith('/')
  })
})
