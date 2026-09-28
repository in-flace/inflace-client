import type { ApiResponse } from '@/shared/api/types'
import { axiosInstance } from '@/shared/api'
import type {
  ApproveBrandsRequest,
  BrandsDto,
  BrandsQuery,
  PendingBrandsDto,
} from '../model/types'

// 어드민 API는 v2 — 기존 인스턴스(v1)의 토큰·refresh 인터셉터는 그대로 쓰고 baseURL만 바꾼다
const V2 = { baseURL: process.env.NEXT_PUBLIC_API_URL_V2 }

export async function fetchPendingBrands(query: {
  page: number
  size: number
}): Promise<PendingBrandsDto> {
  const response = await axiosInstance.get<ApiResponse<PendingBrandsDto>>(
    '/admin',
    { ...V2, params: query }
  )
  return response.data.responseDto
}

export async function fetchBrands(query: BrandsQuery): Promise<BrandsDto> {
  const response = await axiosInstance.get<ApiResponse<BrandsDto>>(
    '/admin/brands',
    { ...V2, params: query }
  )
  return response.data.responseDto
}

export const postApproveBrands = (body: ApproveBrandsRequest) =>
  axiosInstance.post('/admin/brands/approve', body, V2)

export const postRejectBrands = (brandIds: number[]) =>
  axiosInstance.post('/admin/brands/reject', { brandIds }, V2)
