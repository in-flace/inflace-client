import { http, HttpResponse } from 'msw'

const API = process.env.NEXT_PUBLIC_API_URL_V2
let feedbackStatus = 'UNCONFIRMED'

type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type MockBrand = {
  id: number
  name: string
  aiGenerated: boolean
  adminApproved: boolean
  adminReviewStatus: ReviewStatus
}

const CHANNELS = ['민준테크', '뷰티하나', '먹방로그', '캠핑러버', '데일리핏']
let nextChannelBrandId = 100

// 근거 영상 n개 — channelBrandId는 전역에서 유일해야 서버처럼 선택 검증이 된다
const evidence = (alias: string, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const videoId = `mock-${alias}-${i + 1}`
    return {
      channelBrandId: nextChannelBrandId++,
      channelName: CHANNELS[(alias.length + i) % CHANNELS.length],
      matchedAlias: alias,
      youtubeVideoId: videoId,
      youtubeVideoUrl: `https://youtu.be/${videoId}`,
      videoDescription: `${alias} 협찬을 받아 제작한 영상입니다. #광고 #${alias}`,
    }
  })

const brand = (
  id: number,
  name: string,
  status: ReviewStatus,
  aiGenerated = true
): MockBrand => ({
  id,
  name,
  aiGenerated,
  adminApproved: status === 'APPROVED',
  adminReviewStatus: status,
})

// 전체 브랜드 목록 — 검수 대기 브랜드도 서버처럼 여기에 함께 들어있다
const brands: MockBrand[] = [
  brand(1, '삼성전자', 'APPROVED', false),
  brand(2, 'LG생활건강', 'APPROVED', false),
  brand(3, '농심', 'APPROVED', false),
  brand(4, '올리브영', 'APPROVED', false),
  brand(5, '무신사', 'APPROVED'),
  brand(6, '쿠팡', 'APPROVED'),
  brand(7, '배달의민족', 'APPROVED'),
  brand(8, '토스', 'REJECTED'),
  brand(9, '검색 브랜드', 'APPROVED'),
  brand(10, '닥터지', 'APPROVED'),
  brand(11, '마켓컬리', 'REJECTED'),
  brand(12, '스노우피크', 'APPROVED'),
  brand(42, '인플레이스', 'PENDING'),
  brand(43, '닥터지 코리아', 'PENDING'),
  brand(44, '마이프로틴', 'PENDING'),
  brand(45, '헬로네이처', 'PENDING'),
  brand(46, '콜맨', 'PENDING'),
  brand(47, '라운드랩', 'PENDING'),
  brand(48, '오늘의집', 'PENDING'),
]

const evidenceByBrandId: Record<number, ReturnType<typeof evidence>> = {
  42: evidence('인플', 1),
  43: evidence('닥터지', 3),
  44: evidence('마이프로틴', 2),
  45: evidence('헬로네이처', 1),
  46: evidence('콜맨', 2),
  47: evidence('라운드랩', 3),
  48: evidence('오늘의집', 2),
}

const page = <T>(all: T[], params?: URLSearchParams) => {
  const number = Number(params?.get('page') ?? 0)
  const size = Number(params?.get('size') ?? 20)
  return {
    content: all.slice(number * size, (number + 1) * size),
    totalElements: all.length,
    totalPages: Math.ceil(all.length / size),
    number,
  }
}

const ok = () =>
  HttpResponse.json({ success: true, responseDto: null, error: null })
const fail = (status: number, code: string) =>
  HttpResponse.json(
    { success: false, responseDto: null, error: { code, message: code } },
    { status }
  )

const findPending = (ids: number[]) =>
  ids.map((id) =>
    brands.find((b) => b.id === id && b.adminReviewStatus === 'PENDING')
  )

type ApproveBody = {
  brandIds?: number[]
  channelBrandIds?: number[]
  brandNames?: Record<string, string>
  targetBrandIds?: Record<string, number>
}

export const adminHandlers = [
  http.get(`${API}/admin`, ({ request }) => {
    const pending = brands
      .filter((b) => b.adminReviewStatus === 'PENDING')
      .map(({ id, name }) => ({
        id,
        name,
        videoEvidence: evidenceByBrandId[id] ?? [],
      }))
    return HttpResponse.json({
      success: true,
      responseDto: {
        pendingBrands: page(pending, new URL(request.url).searchParams),
      },
      error: null,
    })
  }),

  /* AdminService.approveSelectedBrandVideos의 검증 순서를 흉내 낸다 —
   * mock 모드에서도 에러 토스트를 확인할 수 있게. 병합 충돌(409_MERGE)은 생략 */
  http.post(`${API}/admin/brands/approve`, async ({ request }) => {
    const body = (await request.json()) as ApproveBody
    const brandIds = body.brandIds ?? []
    const channelBrandIds = body.channelBrandIds ?? []
    if (!brandIds.length || !channelBrandIds.length)
      return fail(400, 'COMMON_400')

    const sources = findPending(brandIds)
    if (sources.some((b) => !b)) return fail(404, 'BRAND_404')

    // 선택 영상이 속한 브랜드 집합 == brandIds 여야 한다
    const owners = new Set<number>()
    for (const cbId of channelBrandIds) {
      const owner = Object.entries(evidenceByBrandId).find(([, list]) =>
        list.some((e) => e.channelBrandId === cbId)
      )
      if (!owner) return fail(400, 'COMMON_400')
      owners.add(Number(owner[0]))
    }
    if (
      owners.size !== brandIds.length ||
      brandIds.some((id) => !owners.has(id))
    )
      return fail(400, 'COMMON_400')

    const targets = body.targetBrandIds ?? {}
    for (const source of sources as MockBrand[]) {
      const targetId = targets[source.id] ?? source.id
      if (targetId !== source.id) {
        if (!brands.some((b) => b.id === targetId))
          return fail(404, 'BRAND_404')
        continue
      }
      const name = body.brandNames?.[source.id]?.trim()
      if (!name || name.length > 255) return fail(400, 'BRAND_400_NAME')
      if (brands.some((b) => b.name === name && b.id !== source.id))
        return fail(409, 'BRAND_409_NAME')
    }

    // 검증을 모두 통과한 뒤에 반영 — 서버 트랜잭션처럼 부분 반영이 없도록
    for (const source of sources as MockBrand[]) {
      const targetId = targets[source.id] ?? source.id
      if (targetId === source.id) {
        source.name = body.brandNames![source.id].trim()
        source.adminApproved = true
        source.adminReviewStatus = 'APPROVED'
      } else {
        source.adminReviewStatus = 'REJECTED'
      }
    }
    return ok()
  }),

  http.post(`${API}/admin/brands/reject`, async ({ request }) => {
    const { brandIds = [] } = (await request.json()) as { brandIds?: number[] }
    if (!brandIds.length) return fail(400, 'COMMON_400')
    const sources = findPending(brandIds)
    if (sources.some((b) => !b)) return fail(404, 'BRAND_404')
    for (const source of sources as MockBrand[]) {
      source.adminApproved = false
      source.adminReviewStatus = 'REJECTED'
    }
    return ok()
  }),

  http.get(`${API}/admin/brands`, ({ request }) => {
    const params = new URL(request.url).searchParams
    const query = params.get('query')?.trim() ?? ''
    // 서버와 같이 이름 부분일치(대소문자 무시) 또는 ID 정확히 일치
    const content = brands.filter(
      (b) =>
        !query ||
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        String(b.id) === query
    )
    return HttpResponse.json({
      success: true,
      responseDto: { query, brands: page(content, params) },
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
            submissionLocation:
              'https://dev.inflace.site/influencer/%EC%9D%B8%ED%94%8C%EB%A0%88%EC%9D%B4%EC%8A%A4/UCx7fEaXm9sK2pLqR4tVwY3z',
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
