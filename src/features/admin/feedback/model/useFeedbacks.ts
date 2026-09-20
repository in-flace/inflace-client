import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchFeedbacks, patchFeedbackStatus } from '../api/feedbackApi'
import type { FeedbacksQuery, FeedbackStatus } from './types'

const FEEDBACKS_KEY = ['admin', 'feedbacks'] as const

export function useFeedbacks(query: FeedbacksQuery) {
  return useQuery({
    queryKey: [...FEEDBACKS_KEY, query],
    queryFn: () => fetchFeedbacks(query),
    // 탭·페이지 전환 시 테이블이 비었다 차는 깜빡임 방지
    placeholderData: keepPreviousData,
  })
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: FeedbackStatus }) =>
      patchFeedbackStatus(id, status),
    onSuccess: () => {
      // 탭 카운트도 같이 바뀌므로 목록 전체 무효화
      queryClient.invalidateQueries({ queryKey: FEEDBACKS_KEY })
    },
    onError: () => {
      toast.error('상태 변경에 실패했습니다. 다시 시도해주세요.')
    },
  })
}
