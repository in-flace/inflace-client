'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { refreshChannel } from '../api/channelApi'

export function useRefreshChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (channelId: number) => refreshChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel'] })
    },
  })
}
