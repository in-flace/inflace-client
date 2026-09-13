import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchKpi } from '../api/kpiApi'

export function useKpi(channelId: string) {
  return useSuspenseQuery({
    queryKey: ['kpi', channelId],
    queryFn: () => fetchKpi(channelId),
  })
}
