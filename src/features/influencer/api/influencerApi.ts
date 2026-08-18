import { axiosInstance } from '@/shared/api'
import type { PageInfo } from '@/shared/api/types'
import type { Influencer, SortCriteria, SortOrder } from '@/entities/influencer'

export interface BookmarkResponse {
  responseDto: string
  error: {
    code: string
    message: string
  } | null
  success: boolean
}

export interface InfluencerListResponse {
  content: Influencer[]
  pageInfo: PageInfo
  sort: {
    sorted: boolean
    sortCriteria: SortCriteria | ''
    sortOrder: SortOrder
  }
}

export interface FetchInfluencersParams {
  cursor?: string | null
  /* 서버 스펙상 이름은 pageSize다(미입력 시 9). 이전 이름 size는 서버가 무시했다.
   * 현재 넘기는 곳은 없고 서버 기본값을 그대로 쓴다. */
  pageSize?: number
  channelName?: string
  categoryIds?: number[]
  subscriberFrom?: string
  subscriberTo?: string
  uploadPeriod?: string
  hasAdHistory?: string
  engagementRateFrom?: string
  engagementRateTo?: string
  outlierRange?: string
  sortCriteria?: SortCriteria
  sortOrder?: SortOrder
  bookmarkedOnly?: boolean
}

export async function fetchInfluencers(
  params?: FetchInfluencersParams
): Promise<InfluencerListResponse> {
  const response = await axiosInstance.get<{
    success: boolean
    responseDto: InfluencerListResponse
    error: null
  }>('/influencers', {
    params,
    paramsSerializer: (p) => {
      const searchParams = new URLSearchParams()
      Object.entries(p).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, String(v)))
        } else {
          searchParams.set(key, String(value))
        }
      })
      return searchParams.toString()
    },
  })
  return response.data.responseDto
}

/* 인플루언서 북마크 추가 / 삭제 */
export async function addBookmark(
  channelId: number
): Promise<BookmarkResponse> {
  const response = await axiosInstance.post<BookmarkResponse>(
    `/influencers/${channelId}/bookmark`
  )
  return response.data
}

export async function removeBookmark(
  channelId: number
): Promise<BookmarkResponse> {
  const response = await axiosInstance.delete<BookmarkResponse>(
    `/influencers/${channelId}/bookmark`
  )
  return response.data
}
