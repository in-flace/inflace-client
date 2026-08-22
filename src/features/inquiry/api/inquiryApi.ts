import axios from 'axios'

import { useAuthStore } from '@/shared/api/authStore'
import type { ApiResponse } from '@/shared/api/types'

import type { InquiryPayload } from '../model/types'

/* 공용 axiosInstance를 쓰지 않는 이유.
 *
 * /feedbacks는 인증이 필요 없는 엔드포인트다(백엔드 확인 완료). 반면 공용
 * 인스턴스의 응답 인터셉터는 401을 받으면 refresh를 시도하고, 실패하면 로그인
 * 모달을 강제로 띄운다(axiosInstance.ts). 랜딩의 비로그인 방문자가 문의를 보낼 때
 * 그 경로를 타면 "전송 실패"가 뜬금없는 로그인 요구 화면으로 바뀐다. */
const inquiryClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

export async function submitInquiry(payload: InquiryPayload): Promise<string> {
  /* 인증이 필수는 아니지만, 로그인 상태면 서버가 문의자를 식별할 수 있도록
   * 토큰을 실어준다. 없으면 익명 문의로 그대로 보낸다. */
  const { accessToken } = useAuthStore.getState()

  const res = await inquiryClient.post<ApiResponse<string>>(
    '/feedbacks',
    payload,
    accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined
  )

  /* 이 API는 실패해도 HTTP 200에 success: false로 내려올 수 있어
   * axios가 throw하지 않는다. 여기서 명시적으로 실패로 전환해야
   * useMutation의 onError가 동작한다. */
  if (!res.data.success) {
    throw new Error(res.data.error?.message ?? '문의 전송에 실패했습니다.')
  }

  return res.data.responseDto
}
