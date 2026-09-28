import type { UserDetails, UserChannelDetails, UserInfo } from '../model/types'

const mockProfileImageUrl =
  'https://i.pinimg.com/736x/e2/bc/39/e2bc3977ccf24e3de850deba26cd58b3.jpg'

/* 토큰 */
export const mockAccessToken =
  'eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMTlkYTA2NS03Y2Y3LTdmNzUtYTcxMi1kNWJhZTkwNzM4ZjAiLCJpYXQiOjE3NzQwMzExMjgsImV4cCI6OTk5OTk5OTk5OX0.mock-signature'
export const mockRefreshToken = 'mock-refresh-token'
export const mockNewRefreshToken = 'mock-new-refresh-token'

/* 유저 기본 정보 */
export const mockUserDetails: UserDetails = {
  id: '019da065-7cf7-7f75-a712-d5bae90738f0',
  profileImage: mockProfileImageUrl,
  userRoles: [],
  plan: 'ADMIN',
  isOnboardingCompleted: true,
}

/* 유튜브 채널 정보 */
export const mockUserChannelDetails: UserChannelDetails = {
  channelId: 1714,
  youtubeChannelId: 'mock-channel-id',
  youtubeChannelName: '민준테크',
  youtubeChannelProfileImageUrl: mockProfileImageUrl,
}

/* 유저 정보 (UserDetails + UserChannelDetails) */
export const mockUser: UserInfo = {
  userDetails: mockUserDetails,
  userChannelDetails: null,
}

/* 로그인 API 성공 응답 */
export const mockLoginResponse = {
  success: true,
  error: null,
  responseDto: {
    accessToken: mockAccessToken,
    userDetails: mockUserDetails,
    userChannelDetails: mockUserChannelDetails,
  },
}

/* 로그인 API 실패 응답 */
export const mockLoginErrorResponse = {
  success: false,
  error: { code: 'AUTH_FAILED', message: '인증에 실패했습니다.' },
  responseDto: null,
}

/* 토큰 재발급 API 성공 응답 */
export const mockReissueResponse = {
  success: true,
  error: null,
  responseDto: {
    accessToken: mockAccessToken,
  },
}
