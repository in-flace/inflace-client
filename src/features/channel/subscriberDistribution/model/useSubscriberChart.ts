import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchSubscriberChart } from '../api/subscriberChartApi'

export function useSubscriberChart(channelId: string) {
  return useSuspenseQuery({
    queryKey: ['subscriberChart', channelId],
    queryFn: () => fetchSubscriberChart(channelId),
  })
}
