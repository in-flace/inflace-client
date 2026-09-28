import type { PageDto } from '../../feedback/model/types'

// 백엔드 Admin V2 API와 동일
export type BrandReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export const BRAND_REVIEW_STATUS_LABELS: Record<BrandReviewStatus, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '반려',
}

export interface BrandVideoEvidenceDto {
  channelBrandId: number
  channelName: string
  matchedAlias: string
  youtubeVideoId: string
  youtubeVideoUrl: string
  videoDescription: string
}

export interface PendingBrandDto {
  id: number
  name: string
  videoEvidence: BrandVideoEvidenceDto[]
}

export interface PendingBrandsDto {
  pendingBrands: PageDto<PendingBrandDto>
}

export interface BrandSummaryDto {
  id: number
  name: string
  aiGenerated: boolean
  adminApproved: boolean
  adminReviewStatus: BrandReviewStatus
}

export interface BrandsDto {
  query: string
  brands: PageDto<BrandSummaryDto>
}

export interface BrandsQuery {
  query?: string
  page: number
  size: number
}

/* Swagger에는 brandNames/targetBrandIds가 object로만 나온다.
 * 브랜드 id를 키로 한 맵. 직접 승인 브랜드는 brandNames 필수 (AdminService 참고) */
export interface ApproveBrandsRequest {
  brandIds: number[]
  brandNames: Record<number, string>
  targetBrandIds: Record<number, number>
}
