import { http, HttpResponse } from 'msw'

/* 서버 스펙: submissionLocation은 maxLength 100 */
const LOCATION_MAX = 100

interface CreateFeedbackBody {
  content?: string
  submissionLocation?: string
}

export const feedbackHandlers = [
  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/feedbacks`,
    async ({ request }) => {
      const body = (await request.json()) as CreateFeedbackBody

      /* 목이 무조건 성공을 주면 필드 누락·길이 초과를 개발 중에 발견하지 못한다.
       * 실제 서버가 400을 주는 조건을 그대로 재현한다. */
      if ((body?.submissionLocation?.length ?? 0) > LOCATION_MAX) {
        return HttpResponse.json(
          {
            success: false,
            responseDto: null,
            error: {
              code: 'INVALID_INPUT',
              message: `접수 위치는 ${LOCATION_MAX}자를 넘을 수 없습니다.`,
            },
          },
          { status: 400 }
        )
      }

      return HttpResponse.json({
        success: true,
        responseDto: 'mock-feedback-id',
        error: null,
      })
    }
  ),
]