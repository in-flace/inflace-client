import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/entities/user'
import { fetchFeedbacks, patchFeedbackStatus } from '../api/feedbackApi'
import type { FeedbacksQuery, FeedbackStatus } from './types'

const FEEDBACKS_KEY = ['admin', 'feedbacks'] as const

export function useFeedbacks(query: FeedbacksQuery) {
  // 토큰 없이 먼저 나간 요청은 401로 끝나고 재시도되지 않으므로, 토큰이 생긴 뒤에 시작
  const accessToken = useAuthStore((state) => state.accessToken)
  return useQuery({
    queryKey: [...FEEDBACKS_KEY, query],
    queryFn: () => fetchFeedbacks(query),
    enabled: !!accessToken,
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
