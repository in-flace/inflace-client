import type { ApiResponse } from '@/shared/api/types'
import { axiosInstance } from '@/shared/api'
import type { TrendingVideoResponseDto } from '@/entities/channel/trendingVideo'
import axios from 'axios'

// GET /channels/{channelId}/tops 응답의 videos 배열 항목 (백엔드 원본 모양)
interface ChannelTopVideoDto {
  rank: number
  videoId: number
  title: string
  thumbnailUrl: string
  viewCount: number
  engagementRate: number
  avd: number
  retentionRate: number
}

interface ChannelTopsResponseDto {
  videos: ChannelTopVideoDto[]
}

export async function fetchTrendingVideo(
  channelId: string,
  isShort: boolean
): Promise<TrendingVideoResponseDto[]> {
  try {
    const response = await axiosInstance.get<
      ApiResponse<ChannelTopsResponseDto>
    >(`/channels/${channelId}/tops`, {
      params: isShort ? { filter: 'SHORT_FORM' } : undefined,
    })
    // ctr 자리에는 avd 값을 그대로 사용 (features/main/trendingVideos와 동일)
    return response.data.responseDto.videos.map((video) => ({
      rank: video.rank,
      videoId: video.videoId,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      viewCount: video.viewCount,
      engagementRate: video.engagementRate,
      ctr: video.avd,
      retentionRate: video.retentionRate,
    }))
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.data?.error?.code === 'ANALYTICS_404'
    ) {
      return []
    }
    throw error
  }
}
