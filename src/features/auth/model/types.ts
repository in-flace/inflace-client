import type {
  UserDetails,
  UserChannelDetails,
  ApiResponse,
} from '@/shared/api/types'

/* 로그인 모달 상태 */
export interface LoginModalState {
  isOpen: boolean
  open: () => void
  close: () => void
}

/* 유튜브 채널 연동 모달 상태 */
export interface YoutubeConnectModalState {
  isOpen: boolean
  open: () => void
  close: () => void
}

/* 채널 연동/갱신 API 응답 DTO */
export interface ChannelConnectDto {
  channelId: number
  youtubeChannelId: string
  updatedAt: string
}

/* 팝업 로그인이 성공했을 때 전달되는 결과.
 * 성공 직후 '/'로 전체 새로고침이 일어나 dataLayer가 초기화되므로,
 * 가입/로그인 집계는 리다이렉트 전인 이 시점에 처리해야 한다. */
export interface PopupOAuthSuccess {
  isNewUser: boolean
}

export interface PopupOAuthConfig {
  apiPath: string
  popupName: string
  onSuccess?: (result: PopupOAuthSuccess) => void
}

/* 로그인 API 응답 DTO */
export interface LoginResponseDto {
  accessToken: string
  userDetails: UserDetails
  userChannelDetails: UserChannelDetails | null
  /* 이번 로그인이 최초 가입인지. 백엔드는 /auth/login에서만 내려준다
   * (/user/me의 GetUserMeResponse에는 없다). 새로고침 이후에는 알 수 없으므로
   * 가입 전환을 집계하려면 이 시점에 처리해야 한다. */
  isNewUser: boolean
}

/* 로그인 API 응답 */
export type LoginResponse = ApiResponse<LoginResponseDto | string>
