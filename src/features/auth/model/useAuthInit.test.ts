import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import { useAuthStore } from '@/entities/user'
import { mockAccessToken } from '@/entities/user/mock/mockUser'
import { useAuthInit } from './useAuthInit'

function mockRefreshSuccess() {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify({ accessToken: mockAccessToken }), {
      status: 200,
    })
  )
}

describe('useAuthInit', () => {
  beforeEach(() => {
    useAuthStore.getState().reset()
    useAuthStore.getState().setInitializing(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('마운트 시 /auth/refresh로 POST 요청을 보낸다', async () => {
    const fetchSpy = mockRefreshSuccess()

    renderHook(() => useAuthInit())

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/auth/refresh', { method: 'POST' })
    })
  })

  it('성공 응답 시 authStore에 accessToken이 저장된다', async () => {
    mockRefreshSuccess()

    renderHook(() => useAuthInit())

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe(mockAccessToken)
    })
  })

  it('fetch 실패 시 비로그인 상태를 유지한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new Error('Network error')
    )

    renderHook(() => useAuthInit())

    await waitFor(() => {
      expect(useAuthStore.getState().isInitializing).toBe(false)
    })

    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('응답이 ok가 아닐 때 비로그인 상태를 유지한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 401 })
    )

    renderHook(() => useAuthInit())

    await waitFor(() => {
      expect(useAuthStore.getState().isInitializing).toBe(false)
    })

    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('요청 완료 후 isInitializing이 true에서 false로 전환된다', async () => {
    mockRefreshSuccess()

    expect(useAuthStore.getState().isInitializing).toBe(true)

    renderHook(() => useAuthInit())

    await waitFor(() => {
      expect(useAuthStore.getState().isInitializing).toBe(false)
    })
  })
})
