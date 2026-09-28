import type { ApiResponse } from '@/shared/api/types'
import { axiosInstance } from '@/shared/api'
import type {
  FeedbacksDto,
  FeedbacksQuery,
  FeedbackStatus,
} from '../model/types'

// 어드민 API는 v2 — 기존 인스턴스(v1)의 토큰·refresh 인터셉터는 그대로 쓰고 baseURL만 바꾼다
const V2 = { baseURL: process.env.NEXT_PUBLIC_API_URL_V2 }

export async function fetchFeedbacks(
  query: FeedbacksQuery
): Promise<FeedbacksDto> {
  const response = await axiosInstance.get<ApiResponse<FeedbacksDto>>(
    '/admin/feedbacks',
    { ...V2, params: query }
  )
  return response.data.responseDto
}

export const patchFeedbackStatus = (id: number, status: FeedbackStatus) =>
  axiosInstance.patch(`/admin/feedbacks/${id}/status`, { status }, V2)
