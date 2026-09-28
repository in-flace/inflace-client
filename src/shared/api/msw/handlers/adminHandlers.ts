import { http, HttpResponse } from 'msw'

const API = process.env.NEXT_PUBLIC_API_URL_V2
let pending = true
let feedbackStatus = 'UNCONFIRMED'

const page = <T>(content: T[]) => ({
  content,
  totalElements: content.length,
  totalPages: content.length ? 1 : 0,
  number: 0,
})

const pendingBrand = {
  id: 42,
  name: '인플레이스',
  videoEvidence: [
    {
      channelBrandId: 7,
      channelName: '민준테크',
      matchedAlias: '인플',
      youtubeVideoId: 'mock-video-1',
      youtubeVideoUrl: 'https://youtu.be/mock-video-1',
      videoDescription: '인플레이스 브랜드가 소개된 테스트 영상입니다.',
    },
  ],
}

const brands = [
  {
    id: 9,
    name: '검색 브랜드',
    aiGenerated: true,
    adminApproved: true,
    adminReviewStatus: 'APPROVED',
  },
]

export const adminHandlers = [
  http.get(`${API}/admin`, () =>
    HttpResponse.json({
      success: true,
      responseDto: { pendingBrands: page(pending ? [pendingBrand] : []) },
      error: null,
    })
  ),

  http.post(`${API}/admin/brands/approve`, () => {
    pending = false
    return HttpResponse.json({ success: true, responseDto: null, error: null })
  }),

  http.post(`${API}/admin/brands/reject`, () => {
    pending = false
    return HttpResponse.json({ success: true, responseDto: null, error: null })
  }),

  http.get(`${API}/admin/brands`, ({ request }) => {
    const query = new URL(request.url).searchParams.get('query') ?? ''
    const content = brands.filter(
      (brand) =>
        brand.name.includes(query) || String(brand.id).includes(query)
    )
    return HttpResponse.json({
      success: true,
      responseDto: { query, brands: page(content) },
      error: null,
    })
  }),

  http.get(`${API}/admin/feedbacks`, ({ request }) => {
    const params = new URL(request.url).searchParams
    const status = params.get('status')
    const keyword = params.get('keyword') ?? ''
    const visible =
      (!status || status === feedbackStatus) &&
      '검색 결과가 이상해요'.includes(keyword)
    const content = visible
      ? [
          {
            id: 17,
            ip: '127.0.0.1',
            content: '검색 결과가 이상해요',
            status: feedbackStatus,
            submissionLocation: '/competitor',
            createdAt: '2026-09-23T10:30:00+09:00',
          },
        ]
      : []

    return HttpResponse.json({
      success: true,
      responseDto: {
        totalCount: 1,
        unconfirmedCount: feedbackStatus === 'UNCONFIRMED' ? 1 : 0,
        confirmedCount: feedbackStatus === 'CONFIRMED' ? 1 : 0,
        onHoldCount: feedbackStatus === 'ON_HOLD' ? 1 : 0,
        feedbacks: page(content),
      },
      error: null,
    })
  }),

  http.patch(
    `${API}/admin/feedbacks/:id/status`,
    async ({ request }) => {
      feedbackStatus = ((await request.json()) as { status: string }).status
      return HttpResponse.json({ success: true, responseDto: null, error: null })
    }
  ),
]
