import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import {
  mockAccessToken,
  mockRefreshToken,
} from '@/entities/user/mock/mockUser'

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}))

function createRequest(withAccessToken = true) {
  return new NextRequest('http://localhost/auth/logout', {
    method: 'POST',
    headers: withAccessToken
      ? { Authorization: `Bearer ${mockAccessToken}` }
      : undefined,
  })
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = 'http://api.example.com'
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('POST /auth/logout', () => {
  it('RT 쿠키가 있을 때 백엔드 로그아웃을 호출한다', async () => {
    mockCookieStore.get.mockReturnValue({ value: mockRefreshToken })
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    const { POST } = await import('./route')
    await POST(createRequest())

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
          Cookie: `refreshToken=${mockRefreshToken}`,
        },
      })
    )
  })

  it('RT 쿠키가 있을 때 로그아웃 후 쿠키를 삭제한다', async () => {
    mockCookieStore.get.mockReturnValue({ value: mockRefreshToken })
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 200 })
    )

    const { POST } = await import('./route')
    await POST(createRequest())

    expect(mockCookieStore.delete).toHaveBeenCalledWith('refreshToken')
  })

  it('RT 쿠키가 없을 때도 쿠키 삭제를 호출한다 (멱등)', async () => {
    mockCookieStore.get.mockReturnValue(undefined)

    const { POST } = await import('./route')
    await POST(createRequest(false))

    expect(mockCookieStore.delete).toHaveBeenCalledWith('refreshToken')
  })

  it('RT 쿠키가 없을 때 백엔드 호출 없이 성공을 반환한다', async () => {
    mockCookieStore.get.mockReturnValue(undefined)
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { POST } = await import('./route')
    const response = await POST(createRequest(false))
    const data = await response.json()

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(data.success).toBe(true)
  })

  it('백엔드 로그아웃 실패해도 쿠키를 삭제하고 성공을 반환한다', async () => {
    mockCookieStore.get.mockReturnValue({ value: mockRefreshToken })
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new Error('Network error')
    )

    const { POST } = await import('./route')
    const response = await POST(createRequest())
    const data = await response.json()

    expect(mockCookieStore.delete).toHaveBeenCalledWith('refreshToken')
    expect(data.success).toBe(true)
  })
})
