import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchTypeEngagement } from '../api/typeEngagementApi'

export function useTypeEngagement(channelId: string) {
  return useSuspenseQuery({
    queryKey: ['typeEngagement', channelId],
    queryFn: () => fetchTypeEngagement(channelId),
  })
}
