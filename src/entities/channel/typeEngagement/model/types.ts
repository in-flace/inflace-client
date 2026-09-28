export interface TypeEngagementSummaryDto {
  longFormEngagementRate: number
  shortFormEngagementRate: number
}

export interface TypeEngagementVideoDto {
  rank: number
  videoId: number
  title: string
  thumbnailUrl: string
  contentType: string
  engagementRate: number
}

export interface TypeEngagementResponseDto {
  summary: TypeEngagementSummaryDto
  videos: TypeEngagementVideoDto[]
}
