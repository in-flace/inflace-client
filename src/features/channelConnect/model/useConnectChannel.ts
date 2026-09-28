'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CURRENT_USER_QUERY_KEY } from '@/entities/user'
import type { UserInfo } from '@/entities/user'
import { connectChannel, fetchConnectedChannelProfile } from '../api/channelApi'
import { useYoutubeConnectModal } from './useYoutubeConnectModal'

export function useConnectChannel() {
  const close = useYoutubeConnectModal((s) => s.close)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: connectChannel,
    onSuccess: async (data) => {
      const user = queryClient.getQueryData<UserInfo>(CURRENT_USER_QUERY_KEY)
      if (user) {
        let youtubeChannelName: string | null = null
        let youtubeChannelProfileImageUrl: string | null = null

        try {
          const profile = await fetchConnectedChannelProfile()
          youtubeChannelName = profile.name
          youtubeChannelProfileImageUrl = profile.profileImageUrl
        } catch {
          // 프로필 조회 실패 시 채널 ID만으로 연동 상태 업데이트
        }

        queryClient.setQueryData<UserInfo>(CURRENT_USER_QUERY_KEY, {
          ...user,
          userChannelDetails: {
            channelId: data.channelId,
            youtubeChannelId: data.youtubeChannelId,
            youtubeChannelName,
            youtubeChannelProfileImageUrl,
          },
        })
      }
      close()
    },
  })
}
