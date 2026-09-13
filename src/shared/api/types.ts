/* -------API-------- */
// API 응답 형식
export interface ApiResponse<T> {
  responseDto: T
  error: ApiError | null
  success: boolean
}

// API 에러 형식
export interface ApiError {
  code: string
  message: string
}

/* -------무한 스크롤-------- */
// 페이지네이션 공통 타입
export interface PageInfo {
  size: number
  numberOfElements: number
  nextCursor: string | null
  hasNext: boolean
}

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

// 유저가 결제한 플랜
export type UserPlan = 'FREE' | 'STARTER' | 'GROWTH'
