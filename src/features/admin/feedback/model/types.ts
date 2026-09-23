// 백엔드 Admin Anonymous Feedback API와 동일
export type FeedbackStatus = 'UNCONFIRMED' | 'CONFIRMED' | 'ON_HOLD'

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  UNCONFIRMED: '미확인',
  CONFIRMED: '확인 완료',
  ON_HOLD: '보류',
}

export interface FeedbackDto {
  id: number
  ip: string
  content: string
  status: FeedbackStatus
  submissionLocation: string
  createdAt: string
}

// Spring Page 응답 중 화면에서 쓰는 필드만
export interface PageDto<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

export interface FeedbacksDto {
  totalCount: number
  unconfirmedCount: number
  confirmedCount: number
  onHoldCount: number
  feedbacks: PageDto<FeedbackDto>
}

export interface FeedbacksQuery {
  status?: FeedbackStatus
  keyword?: string
  page: number
  size: number
}
