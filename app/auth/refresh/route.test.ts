import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import {
  mockAccessToken,
  mockRefreshToken,
  mockNewRefreshToken,
  mockReissueResponse,
} from '@/entities/user/mock/mockUser'

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}))

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = 'http://api.example.com'
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('POST /auth/reissue', () => {
  it('RT 쿠키가 없으면 401을 반환한다', async () => {
    mockCookieStore.get.mockReturnValue(undefined)

    const { POST } = await import('./route')
    const response = await POST()

    expect(response.status).toBe(401)
  })

  it('fetch 요청 시 refreshToken을 Cookie 헤더로 전달한다', async () => {
    mockCookieStore.get.mockReturnValue({ value: mockRefreshToken })
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockReissueResponse), { status: 200 })
      )

    const { POST } = await import('./route')
    await POST()

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/auth/reissue'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Cookie: `refreshToken=${mockRefreshToken}`,
        }),
      })
    )
  })

  it('백엔드 성공 시 Set-Cookie 헤더에서 추출한 새 RT 쿠키를 설정한다', async () => {
    mockCookieStore.get.mockReturnValue({ value: mockRefreshToken })
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockReissueResponse), {
        status: 200,
        headers: {
          'set-cookie': `refreshToken=${mockNewRefreshToken}; Path=/; HttpOnly`,
        },
      })
    )

    const { POST } = await import('./route')
    await POST()

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'refreshToken',
      mockNewRefreshToken,
      expect.objectContaining({ httpOnly: true, secure: false })
    )
  })

  it('백엔드 성공 시 { accessToken }를 반환한다', async () => {
    mockCookieStore.get.mockReturnValue({ value: mockRefreshToken })
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockReissueResponse), { status: 200 })
    )

    const { POST } = await import('./route')
    const response = await POST()
    const data = await response.json()

    expect(data.accessToken).toBe(mockAccessToken)
  })

  it('백엔드 실패 시 RT 쿠키를 삭제하고 401을 반환한다', async () => {
    mockCookieStore.get.mockReturnValue({ value: mockRefreshToken })
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Unauthorized', { status: 401 })
    )

    const { POST } = await import('./route')
    const response = await POST()

    expect(mockCookieStore.delete).toHaveBeenCalledWith('refreshToken')
    expect(response.status).toBe(401)
  })

  it('네트워크 에러 시 500을 반환한다', async () => {
    mockCookieStore.get.mockReturnValue({ value: mockRefreshToken })
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new Error('Network error')
    )

    const { POST } = await import('./route')
    const response = await POST()

    expect(response.status).toBe(500)
  })
})
