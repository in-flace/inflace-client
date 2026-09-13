import { axiosInstance } from '@/shared/api/axiosInstance'
import type { ApiResponse } from '@/shared/api/types'
import type { UserInfo } from '../model/types'

export async function fetchCurrentUser(): Promise<UserInfo> {
  const res = await axiosInstance.get<ApiResponse<UserInfo>>('/user/me')
  return res.data.responseDto
}
