import { axiosInstance } from '@/shared/api'
import type { ApiResponse } from '@/shared/api/types'

import type { InquiryPayload } from '../model/types'

/* 서버가 이 엔드포인트에서 Authorization 헤더를 검사하지 않는다.
 * 헤더 없이도, 만료·위조 토큰을 실어도 전부 200으로 받는 것을 확인했다.
 * 따라서 401이 날 일이 없어 axiosInstance의 강제 로그인 경로도 타지 않는다.
 *
 * responseDto는 계약상 string이지만 실제로는 항상 null이라 쓰지 않는다. */
export async function submitInquiry(payload: InquiryPayload): Promise<void> {
  const res = await axiosInstance.post<ApiResponse<null>>('/feedbacks', payload)

  /* 실패해도 HTTP 200에 success: false로 내려올 수 있어 axios가 throw하지
   * 않는다. 여기서 명시적으로 실패로 전환해야 useMutation의 onError가 동작한다. */
  if (!res.data.success) {
    throw new Error(res.data.error?.message ?? '전송에 실패했습니다.')
  }
}
