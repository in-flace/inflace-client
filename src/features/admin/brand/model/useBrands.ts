import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/entities/user'
import {
  fetchBrands,
  fetchPendingBrands,
  postApproveBrands,
  postRejectBrands,
} from '../api/brandApi'
import type { ApproveBrandsRequest, BrandsQuery } from './types'

const BRANDS_KEY = ['admin', 'brands'] as const

export function usePendingBrands(query: { page: number; size: number }) {
  // 토큰 없이 먼저 나간 요청은 401로 끝나고 재시도되지 않으므로, 토큰이 생긴 뒤에 시작
  const accessToken = useAuthStore((state) => state.accessToken)
  return useQuery({
    queryKey: [...BRANDS_KEY, 'pending', query],
    queryFn: () => fetchPendingBrands(query),
    enabled: !!accessToken,
    placeholderData: keepPreviousData,
  })
}

export function useBrands(query: BrandsQuery) {
  const accessToken = useAuthStore((state) => state.accessToken)
  return useQuery({
    queryKey: [...BRANDS_KEY, 'all', query],
    queryFn: () => fetchBrands(query),
    enabled: !!accessToken,
    placeholderData: keepPreviousData,
  })
}

// 승인/반려 모두 대기 큐와 전체 목록에 영향 → 어드민 브랜드 쿼리 전체 무효화
function useInvalidateBrands() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: BRANDS_KEY })
}

export function useApproveBrands() {
  const invalidate = useInvalidateBrands()
  return useMutation({
    mutationFn: (body: ApproveBrandsRequest) => postApproveBrands(body),
    onSuccess: () => {
      toast.success('승인했습니다.')
      invalidate()
    },
    onError: () => {
      toast.error('승인에 실패했습니다. 다시 시도해주세요.')
    },
  })
}

export function useRejectBrands() {
  const invalidate = useInvalidateBrands()
  return useMutation({
    mutationFn: (brandIds: number[]) => postRejectBrands(brandIds),
    onSuccess: () => {
      toast.success('반려했습니다.')
      invalidate()
    },
    onError: () => {
      toast.error('반려에 실패했습니다. 다시 시도해주세요.')
    },
  })
}
