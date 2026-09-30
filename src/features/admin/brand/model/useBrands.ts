import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/entities/user'
import type { ApiResponse } from '@/shared/api/types'
import {
  fetchBrands,
  fetchPendingBrands,
  postApproveBrands,
  postRejectBrands,
} from '../api/brandApi'
import type { ApproveBrandsRequest, BrandsQuery } from './types'

const BRANDS_KEY = ['admin', 'brands'] as const

// 관리자가 입력을 고쳐 다시 시도할 수 있는 에러만 안내 — 나머지는 일반 실패 문구
const APPROVE_ERROR_MESSAGES: Record<string, string> = {
  BRAND_400_NAME: '승인 이름이 올바르지 않습니다. (공백 불가, 255자 이하)',
  BRAND_409_NAME:
    '이미 있는 브랜드 이름입니다. 대상 Brand ID에 기존 브랜드 ID를 넣어 병합해주세요.',
  BRAND_409_MERGE:
    '같은 채널의 영상이 같은 대상 브랜드로 중복 병합됩니다. 선택을 확인해주세요.',
  BRAND_404: '대상 Brand ID에 해당하는 브랜드가 없습니다.',
}

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
    onError: (error) => {
      const code = isAxiosError<ApiResponse<never>>(error)
        ? error.response?.data?.error?.code
        : undefined
      toast.error(
        (code && APPROVE_ERROR_MESSAGES[code]) ??
          '승인에 실패했습니다. 다시 시도해주세요.'
      )
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
