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

/* 서버(AdminService.approveSelectedBrandVideos)는 channelBrandIds가 속한 브랜드 집합과
 * brandIds가 정확히 같아야 승인한다. brandNames/targetBrandIds는 브랜드 id를 키로 한 맵 —
 * targetBrandIds가 없으면 신규 승인으로 보고, 신규 승인 브랜드만 brandNames가 필수다 */
export interface ApproveBrandsRequest {
  brandIds: number[]
  channelBrandIds: number[]
  brandNames: Record<number, string>
  targetBrandIds: Record<number, number>
}
