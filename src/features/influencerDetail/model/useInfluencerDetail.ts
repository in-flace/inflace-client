import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchInfluencerDetail } from '../api/influencerDetailApi'

export function useInfluencerDetail(channelId: string) {
  return useSuspenseQuery({
    queryKey: ['influencerDetail', channelId],
    queryFn: () => fetchInfluencerDetail(channelId),
  })
}
