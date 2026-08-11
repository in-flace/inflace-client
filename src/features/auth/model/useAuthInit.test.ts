import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import { useAuthStore } from '@/shared/api'
import { fetchCurrentUser } from '@/shared/api/userApi'
import { mockUser, mockAccessToken } from '@/shared/api/mock/mockUser'
import { useAuthInit } from './useAuthInit'

/* 훅은 유저 정보를 /auth/refresh 응답에서 꺼내지 않는다.
 * 토큰만 받아 저장한 뒤 fetchCurrentUser()로 따로 가져오는데, 이건 fetch가 아니라
 * axiosInstance를 쓴다. globalThis.fetch만 모킹하면 이 호출이 실패하고 훅의 catch가
 * 삼켜서 user가 끝내 null로 남는다(= 기존 실패 1건의 원인).
 * 응답 본문도 accessToken만 둔다. user를 넣어두면 훅이 그걸 쓰는 것처럼 읽힌다. */
vi.mock('@/shared/api/userApi', () => ({
  fetchCurrentUser: vi.fn(),
}))

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
    vi.mocked(fetchCurrentUser).mockResolvedValue(mockUser)
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

  it('성공 응답 시 authStore에 accessToken과 user가 저장된다', async () => {
    mockRefreshSuccess()

    renderHook(() => useAuthInit())

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe(mockAccessToken)
      expect(useAuthStore.getState().user).toEqual(mockUser)
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
