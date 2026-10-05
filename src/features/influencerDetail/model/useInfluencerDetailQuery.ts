import { useQuery } from '@tanstack/react-query'
import { fetchInfluencerDetail } from '../api/influencerDetailApi'

/* useInfluencerDetail(suspense)과 같은 쿼리를 에러를 던지지 않고 상태로 받는다.
 * 영상 50개 미만 채널은 서버가 CHANNEL_INSIGHT_400을 주는데, 지표 섹션은 이를
 * "영상 부족" 안내로 그려야 한다. suspense 훅은 에러를 렌더 중에 던져
 * 경계 없는 섹션에서 페이지 전체가 죽었다(QA #67). queryKey가 같아 요청은 한 번만 나간다. */
export function useInfluencerDetailQuery(channelId: string) {
  return useQuery({
    queryKey: ['influencerDetail', channelId],
    queryFn: () => fetchInfluencerDetail(channelId),
    enabled: !!channelId,
  })
}
