'use client'

import { useMutation } from '@tanstack/react-query'

import { useAuthStore } from '@/entities/user'
import { connectChannel, fetchConnectedChannelProfile } from '../api/channelApi'
import { useYoutubeConnectModal } from './useYoutubeConnectModal'

export function useConnectChannel() {
  const close = useYoutubeConnectModal((s) => s.close)

  return useMutation({
    mutationFn: connectChannel,
    onSuccess: async (data) => {
      const { accessToken, user } = useAuthStore.getState()
      if (accessToken && user) {
        let youtubeChannelName: string | null = null
        let youtubeChannelProfileImageUrl: string | null = null

        try {
          const profile = await fetchConnectedChannelProfile()
          youtubeChannelName = profile.name
          youtubeChannelProfileImageUrl = profile.profileImageUrl
        } catch {
          // 프로필 조회 실패 시 채널 ID만으로 연동 상태 업데이트
        }

        useAuthStore.getState().setAuth(accessToken, {
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
