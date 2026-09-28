import { http, HttpResponse } from 'msw'

import {
  mockAccessToken,
  mockUser,
  mockUserChannelDetails,
} from '@/entities/user/mock/mockUser'
import { isMockChannelConnected } from './channelConnectHandlers'

// 서비스 워커 컨텍스트에서 mock 로그인 상태를 추적하는 플래그
// httpOnly 쿠키는 서비스 워커에서 읽을 수 없으므로 모듈 변수로 관리
let isMockLoggedIn = true

// 브라우저가 Next.js Route Handler로 보내는 요청을 인터셉트
export const authHandlers = [
  http.get(`${process.env.NEXT_PUBLIC_API_URL}/user/me`, () => {
    if (!isMockLoggedIn) {
      return HttpResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    return HttpResponse.json({
      success: true,
      responseDto: {
        ...mockUser,
        userChannelDetails: isMockChannelConnected()
          ? mockUserChannelDetails
          : null,
      },
      error: null,
    })
  }),

  // 로그인 상태일 때만 mock 토큰 반환, 로그아웃 후 새로고침 시 401
  http.post(`${process.env.NEXT_PUBLIC_APP_URL}/auth/refresh`, () => {
    if (!isMockLoggedIn) {
      return HttpResponse.json(
        { error: 'Refresh token이 없습니다.' },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      accessToken: mockAccessToken,
      user: mockUser,
    })
  }),

  // 로그아웃 시 플래그 해제 (실제 쿠키 삭제는 Next.js 라우트가 처리)
  http.post(`${process.env.NEXT_PUBLIC_APP_URL}/auth/logout`, () => {
    isMockLoggedIn = false
    return HttpResponse.json({ success: true })
  }),

  // mock-callback에서 호출 → 재로그인 시 플래그 복구
  http.post(`${process.env.NEXT_PUBLIC_APP_URL}/auth/mock-login`, () => {
    isMockLoggedIn = true
    return HttpResponse.json({ success: true })
  }),
]
