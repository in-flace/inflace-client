import type { UserPlan } from '@/shared/api/types'

/* -------유저 정보-------- */
// 유저 기본 정보
export interface UserDetails {
  id: string
  profileImage: string | null
  userRoles: string[]
  plan: UserPlan
  isOnboardingCompleted: boolean
}

// 유튜브 채널 정보 (미연동 시 null)
export interface UserChannelDetails {
  channelId: number | null
  youtubeChannelId: string | null
  youtubeChannelName: string | null
  youtubeChannelProfileImageUrl: string | null
}

// 유저 정보 (유저 기본 정보 + 유튜브 채널 정보)
export interface UserInfo {
  userDetails: UserDetails
  userChannelDetails: UserChannelDetails | null
}

// 유저의 상태
export interface AuthState {
  accessToken: string | null
  user: UserInfo | null
  isInitializing: boolean
  setAuth: (accessToken: string, user: UserInfo | null) => void
  reset: () => void
  setInitializing: (value: boolean) => void
}
