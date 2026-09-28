import { http, HttpResponse } from 'msw'
import {
  mockChannelTrendingVideo,
  mockChannelTrendingVideoShort,
  type TrendingVideoResponseDto,
} from '@/entities/channel/trendingVideo'

// 실제 백엔드는 ctr이 아니라 avd 필드를 내려준다. mock 데이터는 프론트 DTO(ctr)
// 형태로 관리하고, 응답 직전에만 wire 포맷(avd)으로 되돌려 실제 API와 모양을 맞춘다.
function toRawChannelTopVideo({ ctr, ...rest }: TrendingVideoResponseDto) {
  return { ...rest, avd: ctr }
}

export const channelTrendingVideoHandlers = [
  http.get(
    `${process.env.NEXT_PUBLIC_API_URL}/channels/:channelId/tops`,
    ({ request }) => {
      const url = new URL(request.url)
      const filter = url.searchParams.get('filter')

      const responseDto: TrendingVideoResponseDto[] =
        filter === 'SHORT_FORM'
          ? mockChannelTrendingVideoShort
          : mockChannelTrendingVideo

      return HttpResponse.json({
        success: true,
        responseDto: { videos: responseDto.map(toRawChannelTopVideo) },
        error: null,
      })
    }
  ),
]
