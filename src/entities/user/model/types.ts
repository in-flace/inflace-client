/* -------유저 역할/니즈-------- */
export type UserRole =
  | 'YOUTUBER'
  | 'MARKETER'
  | 'BRAND_MANAGER'
  | 'MCN_AGENCY'
  | 'CONTENT_PLANNER'
  | 'ETC'

export type Need =
  | 'CHANNEL_ANALYSIS'
  | 'INFLUENCER_SEARCH'
  | 'YOUTUBE_CONTENT_SEARCH'
  | 'FAKE_SUBSCRIBER_DETECT'
  | 'COMPETITOR_BENCHMARK'
  | 'COLLAB_PROPOSAL'
  | 'INSIGHT_MAGAZINE'

export const ROLE_LABEL: Record<UserRole, string> = {
  YOUTUBER: '유튜버',
  MARKETER: '마케터',
  BRAND_MANAGER: '브랜드 담당자',
  MCN_AGENCY: 'MCN / 에이전시',
  CONTENT_PLANNER: '콘텐츠기획자',
  ETC: '기타',
}

export const NEED_LABEL: Record<Need, string> = {
  CHANNEL_ANALYSIS: '내 채널 관리 & 분석',
  INFLUENCER_SEARCH: '인플루언서 탐색 & 비교',
  YOUTUBE_CONTENT_SEARCH: '유튜브 콘텐츠 탐색 & 비교',
  FAKE_SUBSCRIBER_DETECT: '가짜 구독자 탐지',
  COMPETITOR_BENCHMARK: '경쟁사 벤치마크',
  COLLAB_PROPOSAL: '협업 제안 관리',
  INSIGHT_MAGAZINE: '인사이트 매거진',
}

/* -------유저 정보-------- */
// 유저가 결제한 플랜 (백엔드 UserDetailsResponse.plan과 동일)
// PRO/EARLYBIRD는 결제 시기만 다른 동일한 유료 등급, ADMIN은 내부 관리자
export type UserPlan = 'FREE' | 'PRO' | 'EARLYBIRD' | 'ADMIN'

// 유저 기본 정보
export interface UserDetails {
  id: string
  profileImage: string | null
  userRoles: UserRole[]
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
  isInitializing: boolean
  setAccessToken: (accessToken: string) => void
  reset: () => void
  setInitializing: (value: boolean) => void
}
