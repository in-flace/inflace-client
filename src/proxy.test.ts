import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { proxy } from './proxy'

function createRequest(path: string, authenticated = false) {
  return new NextRequest(`http://localhost${path}`, {
    headers: authenticated ? { Cookie: 'refreshToken=token' } : undefined,
  })
}

describe('proxy', () => {
  it('RT 쿠키 없이 보호 경로에 접근하면 홈으로 리다이렉트한다', () => {
    const response = proxy(createRequest('/main'))

    expect(response?.status).toBe(307)
    expect(response?.headers.get('location')).toBe(
      'http://localhost/?from=protected'
    )
  })

  it('RT 쿠키가 있으면 보호 경로 접근을 허용한다', () => {
    expect(proxy(createRequest('/main', true))).toBeUndefined()
  })

  it('공개 경로는 RT 쿠키 없이 접근을 허용한다', () => {
    expect(proxy(createRequest('/influencer'))).toBeUndefined()
  })
})
