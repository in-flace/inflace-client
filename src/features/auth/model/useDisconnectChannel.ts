'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/entities/user'
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
    },
    onSuccess: () => {
      const { accessToken, user } = useAuthStore.getState()
      if (accessToken && user) {
        useAuthStore.getState().setAuth(accessToken, {
          ...user,
          userChannelDetails: null,
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['channelProfile'] })
    },
  })
}
