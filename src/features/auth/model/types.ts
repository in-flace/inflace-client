import type { AuthProvider, LoginModalTrigger } from '@/shared/analytics'
import type {
  UserDetails,
  UserChannelDetails,
  ApiResponse,
} from '@/shared/api/types'

/* 로그인 모달 상태 */
export interface LoginModalState {
  isOpen: boolean
  /* 진입 경로를 필수로 받는다. 선택으로 두면 새 호출부가 생겼을 때 조용히
   * 누락되어 전환율 분모가 틀어진다. 타입으로 강제해 컴파일 때 드러나게 한다. */
  open: (trigger: LoginModalTrigger) => void
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

export interface PopupOAuthConfig {
  apiPath: string
  popupName: string
  /* 어떤 제공자로 로그인했는지. 계측 이벤트에 그대로 실린다. */
  provider: AuthProvider
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
