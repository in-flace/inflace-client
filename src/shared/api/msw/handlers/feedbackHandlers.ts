import { http, HttpResponse } from 'msw'

export const feedbackHandlers = [
  http.post(`${process.env.NEXT_PUBLIC_API_URL}/feedbacks`, () => {
    return HttpResponse.json({
      success: true,
      responseDto: 'mock-feedback-id',
      error: null,
    })
  }),
]
