import type { ApiResponse } from '@/shared/api'
import { axiosInstance } from '@/shared/api'
import type { VideoStatsDto, KpiMetric } from '@/entities/video'

// GET /videos/{videoId}/stats 응답 (백엔드 원본 모양, ctr 대신 avd)
interface VideoStatsResponseDto {
  collectedAt: string
  viewCount: KpiMetric
  likeCount: KpiMetric
  commentCount: KpiMetric
  shareCount: KpiMetric
  subscribersGained: KpiMetric
  avd: KpiMetric
  engagementRate: KpiMetric
  newViewerRate: KpiMetric
  outlier: KpiMetric
  vph: KpiMetric
}

export async function fetchVideoStats(videoId: string): Promise<VideoStatsDto> {
  const response = await axiosInstance.get<ApiResponse<VideoStatsResponseDto>>(
    `/videos/${videoId}/stats`
  )
  const stats = response.data.responseDto
  // ctr 자리에는 avd 값을 그대로 사용 (features/main/trendingVideos와 동일)
  return {
    collectedAt: stats.collectedAt,
    viewCount: stats.viewCount,
    likeCount: stats.likeCount,
    commentCount: stats.commentCount,
    shareCount: stats.shareCount,
    subscribersGained: stats.subscribersGained,
    ctr: stats.avd,
    engagementRate: stats.engagementRate,
    newViewerRate: stats.newViewerRate,
    outlier: stats.outlier,
    vph: stats.vph,
  }
}
