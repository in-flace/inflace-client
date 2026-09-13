import { http, HttpResponse } from 'msw'
import { getMockVideoStats } from '@/features/videoDetail/stats'
import type { VideoStatsDto } from '@/entities/video'

// 실제 백엔드는 ctr이 아니라 avd 필드를 내려준다. mock 데이터는 프론트 DTO(ctr)
// 형태로 관리하고, 응답 직전에만 wire 포맷(avd)으로 되돌려 실제 API와 모양을 맞춘다.
function toRawVideoStats({ ctr, ...rest }: VideoStatsDto) {
  return { ...rest, avd: ctr }
}

export const videoStatsHandlers = [
  http.get(
    `${process.env.NEXT_PUBLIC_API_URL}/videos/:videoId/stats`,
    async ({ params }) => {
      return HttpResponse.json({
        success: true,
        responseDto: toRawVideoStats(getMockVideoStats(String(params.videoId))),
        error: null,
      })
    }
  ),
]
