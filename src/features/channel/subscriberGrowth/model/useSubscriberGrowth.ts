import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchSubscriberGrowth } from '../api/subscriberGrowthApi'

export function useSubscriberGrowth(channelId: string, range: string) {
  return useSuspenseQuery({
    queryKey: ['subscriberGrowth', channelId, range],
    queryFn: () => fetchSubscriberGrowth(channelId, range),
  })
}
