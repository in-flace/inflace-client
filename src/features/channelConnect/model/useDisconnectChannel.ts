'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { CURRENT_USER_QUERY_KEY } from '@/entities/user'
import type { UserInfo } from '@/entities/user'
import type { ChannelProfileDto } from '@/entities/main/channelProfile'
import { disconnectChannel } from '../api/channelApi'

export function useDisconnectChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (channelId: number) => disconnectChannel(channelId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['channelProfile'] })
      const previousProfile = queryClient.getQueryData<ChannelProfileDto>([
        'channelProfile',
      ])
      queryClient.setQueryData(['channelProfile'], null)
      return { previousProfile }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(['channelProfile'], context?.previousProfile)
      toast.error('채널 연동 해제에 실패했습니다. 다시 시도해주세요.')
    },
    onSuccess: () => {
      queryClient.setQueryData<UserInfo>(CURRENT_USER_QUERY_KEY, (user) => {
        if (!user) return user
        return {
          ...user,
          userChannelDetails: null,
        }
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['channelProfile'] })
    },
  })
}
