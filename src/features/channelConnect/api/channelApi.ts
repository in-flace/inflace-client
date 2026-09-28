import type { ApiResponse } from '@/shared/api/types'
import { axiosInstance } from '@/shared/api'
import type { ChannelConnectDto } from '../model/types'
import type { ChannelProfileDto } from '@/entities/main/channelProfile'

export async function connectChannel(): Promise<ChannelConnectDto> {
  const res = await axiosInstance.post<ApiResponse<ChannelConnectDto>>(
    '/channels/connect'
  )
  return res.data.responseDto
}

export async function refreshChannel(
  channelId: number
): Promise<ChannelConnectDto> {
  const res = await axiosInstance.post<ApiResponse<ChannelConnectDto>>(
    `/channels/${channelId}/refresh`
  )
  return res.data.responseDto
}

export async function fetchConnectedChannelProfile(): Promise<ChannelProfileDto> {
  const res = await axiosInstance.get<ApiResponse<ChannelProfileDto>>(
    '/user/channels/main'
  )
  return res.data.responseDto
}

export async function disconnectChannel(channelId: number): Promise<void> {
  await axiosInstance.delete<ApiResponse<null>>(
    `/channels/connect/${channelId}`
  )
}
