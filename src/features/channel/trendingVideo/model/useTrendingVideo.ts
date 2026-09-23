import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchTrendingVideo } from '../api/trendingVideoApi'

export function useTrendingVideo(channelId: string, isShort: boolean) {
  return useSuspenseQuery({
    queryKey: ['trendingVideo', channelId, isShort],
    queryFn: () => fetchTrendingVideo(channelId, isShort),
  })
}
