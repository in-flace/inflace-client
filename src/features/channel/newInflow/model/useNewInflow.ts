import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchNewInflow } from '../api/newInflowApi'

export function useNewInflow(channelId: string, isShort: boolean) {
  return useSuspenseQuery({
    queryKey: ['newInflow', channelId, isShort],
    queryFn: () => fetchNewInflow(channelId, isShort),
  })
}
