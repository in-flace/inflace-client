import { http, HttpResponse } from 'msw'

import { mockBrandCollaborations } from '@/features/competitor/mock/mockBrandCollaborations'

const PAGE_SIZE = 9

const mockTrendsKeywords = [
  '갤럭시',
  '아이폰17',
  '실사용후기',
  '성능비교',
  '가성비',
  '언박싱',
  '벤치마크',
  '노트북추천',
  '배터리',
  '발열',
  '카메라성능',
  '내돈내산',
  '구매가이드',
]

/* 키워드 검색의 크레딧 거절을 재현한다. 서버는 크레딧 차감이 켜져 있을 때
 * 크레딧 부족이면 400, 무료 회원이면 403을 준다. */
const CREDIT_ERRORS: Record<string, [string, number]> = {
  insufficient: ['CREDIT_400_INSUFFICIENT', 400],
  forbidden: ['AUTH_403', 403],
}

function readCreditErrorFlag() {
  try {
    return typeof sessionStorage === 'undefined'
      ? null
      : sessionStorage.getItem('mock:credit:search-error')
  } catch {
    return null
  }
}

export const brandCollaborationsHandlers = [
  http.get(
    `${process.env.NEXT_PUBLIC_API_URL}/brand-collaborations`,
    ({ request }) => {
      const url = new URL(request.url)
      const creditError = CREDIT_ERRORS[readCreditErrorFlag() ?? '']
      if (creditError && url.searchParams.has('includeKeywords')) {
        const [code, status] = creditError
        return HttpResponse.json(
          { success: false, responseDto: null, error: { code, message: code } },
          { status }
        )
      }
      const cursor = url.searchParams.get('cursor')
      const pageSize = Number(url.searchParams.get('pageSize')) || PAGE_SIZE
      const sortCriteria = url.searchParams.get('sortCriteria') ?? 'LATEST'
      const sortOrder = url.searchParams.get('sortOrder') ?? 'DESC'

      /* cursor는 단순히 다음 페이지 인덱스를 문자열로 표현 — 첫 요청은 null */
      const pageIndex = cursor ? Number(cursor) : 0
      const start = pageIndex * pageSize
      const end = start + pageSize
      const slice = mockBrandCollaborations.slice(start, end)
      const hasNext = end < mockBrandCollaborations.length
      const nextCursor = hasNext ? String(pageIndex + 1) : null

      return HttpResponse.json({
        success: true,
        responseDto: {
          content: slice,
          pageInfo: {
            size: pageSize,
            numberOfElements: slice.length,
            nextCursor,
            hasNext,
          },
          sort: {
            sorted: true,
            sortCriteria,
            sortOrder,
          },
        },
        error: null,
      })
    }
  ),
  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/brand-collaborations/trends`,
    async ({ request }) => {
      const body = (await request.json()) as { youtubeVideoIds: string[] }
      /* 선택 영상 1개당 채널 1개 매칭으로 가정 */
      const channelCount = body.youtubeVideoIds.length

      return HttpResponse.json({
        success: true,
        responseDto: {
          contentKeywords: {
            keywords: mockTrendsKeywords,
            keywordSummary:
              '선정된 영상들은 공통적으로 최신 스마트폰·노트북의 실사용 후기 맥락에서 제품을 소개합니다. 스펙 나열보다 배터리·발열·카메라 성능을 직접 측정한 벤치마크 장면과 경쟁 기기와의 비교가 반복되며, "내돈내산"처럼 자발적 구매처럼 보이는 연출로 신뢰감을 주는 구조가 공통적입니다.',
          },
          channelCharacteristics: {
            channelCount,
            avgSubscribers: 840000,
            minSubscribers: 90000,
            maxSubscribers: 4200000,
            uploadIntervalDays: 4.5,
            categoryDistribution: [
              { category: '테크/IT 리뷰', percentage: 68.0 },
              { category: '모바일/스마트폰', percentage: 21.0 },
              { category: 'PC/노트북', percentage: 11.0 },
            ],
          },
          strategyInsight: {
            pplIntent:
              '해당 브랜드는 가성비와 성능을 동시에 강조하는 포지셔닝을 가집니다. 선정된 채널들은 구매 직전 정보 탐색을 하는 20~30대 IT 관심층 구독자가 많아, 별도 타겟팅 없이 높은 구매 의향층에 직접 도달할 수 있는 채널입니다. 특히 재협업 채널들은 초기 캠페인에서 전환율이 높았던 곳으로, 신제품 출시 주기에 맞춘 지속 노출로 브랜드 신뢰도를 쌓는 전략으로 해석됩니다.',
            competitivePoints:
              '"스펙보다 실사용" 메시지가 핵심입니다. 직접 측정한 벤치마크 수치, 경쟁 기기와의 1:1 비교, 크리에이터의 장기 사용 서사를 통해 제품 신뢰를 구축합니다. 광고처럼 보이지 않는 "내돈내산" 연출과 단점까지 짚어주는 솔직 리뷰 전략도 공통적으로 사용됩니다.',
          },
        },
        error: null,
      })
    }
  ),
]
