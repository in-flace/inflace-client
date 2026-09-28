import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchSubscriberDistribution } from '../api/DistributionChartApi'

type DistributionToggle = 'countries' | 'ages'

export function useDistributionChart(channelId: string) {
  const [filter, setFilter] = useState<DistributionToggle>('countries')

  const query = useSuspenseQuery({
    queryKey: ['distributionChart', channelId, filter],
    queryFn: () => fetchSubscriberDistribution(channelId, ['genders', filter]),
  })

  return { ...query, filter, setFilter }
}
