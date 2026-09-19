import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  putPreferences,
  EditPreferencesPayload,
} from '../api/editPreferencesApi'
import type { MyProfileDto } from '../types'

export function useEditPreferences() {
  const queryClient = useQueryClient()

  /**
   * 유저의 직업 및 기능 변경 시 낙관적 업데이트
   * 서버 응답을 기다리지 않고 즉시 캐시를 업데이트
   * 실패 시 이전 값으로 롤백
   */
  return useMutation({
    mutationFn: putPreferences,
    onMutate: async (payload: EditPreferencesPayload) => {
      await queryClient.cancelQueries({ queryKey: ['myProfile'] })

      const previous = queryClient.getQueryData<MyProfileDto>(['myProfile'])

      queryClient.setQueryData<MyProfileDto>(['myProfile'], (old) => {
        if (!old) return old
        return {
          ...old,
          preferences: {
            roles: payload.roles,
            needs: payload.needs,
          },
        }
      })

      return { previous }
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.setQueryData<MyProfileDto>(['myProfile'], data.responseDto)
      }
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['myProfile'], context.previous)
      }
      toast.error('직업/관심사 변경에 실패했습니다. 다시 시도해주세요.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] })
    },
  })
}
