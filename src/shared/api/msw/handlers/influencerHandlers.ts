import { http, HttpResponse } from 'msw'

import {
  mockInfluencers,
  MOCK_INFLUENCER_FILTER_META,
} from '@/features/influencer/mock/mockInfluencers'
import { mockYoutubeCategories } from '@/entities/youtubeCategory'

const PAGE_SIZE = 9

/* 최근 업로드 주기 버킷. 서버 스펙의 열거값과 필터 UI 라벨을 그대로 옮긴 것이다.
 * 누적이 아니라 구간이다 — 30D는 "1개월 이내"가 아니라 "1주일 ~ 1개월"이다. */
const UPLOAD_PERIOD_RANGES: Record<string, { min: number; max: number }> = {
  '7D': { min: 0, max: 6 },
  '30D': { min: 7, max: 30 },
  '31_90D': { min: 31, max: 90 },
  '91_180D': { min: 91, max: 180 },
  '180D_PLUS': { min: 181, max: Number.POSITIVE_INFINITY },
}

/* outlierRange는 "그 배수 이상"으로 해석한다. 스펙에 상세 설명이 없어 추정이며,
 * 실제 판정은 서버가 한다. 목에서 필터가 결과를 바꾸는지 확인하는 용도다. */
function matchesOutlierRange(multiple: number, range: string) {
  const threshold = Number.parseFloat(range)
  return Number.isFinite(threshold) ? multiple >= threshold : true
}

export const influencerHandlers = [
  http.get(`${process.env.NEXT_PUBLIC_API_URL}/youtube-categories`, () => {
    return HttpResponse.json({
      responseDto: {
        youtubeCategories: mockYoutubeCategories,
      },
      error: null,
      success: true,
    })
  }),

  http.get(`${process.env.NEXT_PUBLIC_API_URL}/influencers`, ({ request }) => {
    const url = new URL(request.url)
    const channelName = url.searchParams.get('channelName') ?? ''
    const categoryIdParams = url.searchParams.getAll('categoryIds').map(Number)
    const subscriberFrom = url.searchParams.get('subscriberFrom')
    const subscriberTo = url.searchParams.get('subscriberTo')
    const uploadPeriod = url.searchParams.get('uploadPeriod') ?? ''
    const hasAdHistory = url.searchParams.get('hasAdHistory')
    const engagementRateFrom = url.searchParams.get('engagementRateFrom')
    const engagementRateTo = url.searchParams.get('engagementRateTo')
    const outlierRange = url.searchParams.get('outlierRange') ?? ''
    const sortCriteria = url.searchParams.get('sortCriteria') ?? 'subscriber'
    const sortOrder = url.searchParams.get('sortOrder') ?? 'DESC'
    const cursor = url.searchParams.get('cursor')
    const bookmarkedOnly = url.searchParams.get('bookmarkedOnly') === 'true'

    let filtered = [...mockInfluencers]

    if (bookmarkedOnly) {
      filtered = filtered.filter((i) => i.bookmarked)
    }

    if (channelName) {
      filtered = filtered.filter((i) =>
        i.channelName.toLowerCase().includes(channelName.toLowerCase())
      )
    }

    if (categoryIdParams.length > 0) {
      filtered = filtered.filter((i) =>
        i.categories.some((cat) =>
          categoryIdParams.some(
            (id) =>
              mockYoutubeCategories.find((mc) => mc.id === id)?.title === cat
          )
        )
      )
    }

    if (subscriberFrom) {
      filtered = filtered.filter(
        (i) => i.subscriberCount >= Number(subscriberFrom)
      )
    }
    if (subscriberTo) {
      filtered = filtered.filter(
        (i) => i.subscriberCount <= Number(subscriberTo)
      )
    }

    /* 광고 이력은 최근 PPL 브랜드 유무로 판단한다. */
    if (hasAdHistory === 'true' || hasAdHistory === 'false') {
      const wanted = hasAdHistory === 'true'
      filtered = filtered.filter((i) => i.recentPplBrands.length > 0 === wanted)
    }

    if (uploadPeriod) {
      const range = UPLOAD_PERIOD_RANGES[uploadPeriod]
      /* 스펙에 없는 값이 오면 실서버는 500을 낸다. 목도 빈 결과로 두어
       * "필터가 안 걸린 것처럼 전부 보이는" 오해를 만들지 않는다. */
      filtered = range
        ? filtered.filter((i) => {
            const days =
              MOCK_INFLUENCER_FILTER_META[i.channelId]?.daysSinceLastUpload
            return days !== undefined && days >= range.min && days <= range.max
          })
        : []
    }

    if (outlierRange) {
      filtered = filtered.filter((i) => {
        const multiple =
          MOCK_INFLUENCER_FILTER_META[i.channelId]?.outlierMultiple
        return (
          multiple !== undefined && matchesOutlierRange(multiple, outlierRange)
        )
      })
    }

    if (engagementRateFrom) {
      filtered = filtered.filter(
        (i) => i.averageEngagementRate >= Number(engagementRateFrom)
      )
    }
    if (engagementRateTo) {
      filtered = filtered.filter(
        (i) => i.averageEngagementRate <= Number(engagementRateTo)
      )
    }

    const sortKey =
      sortCriteria === 'engagement_rate'
        ? 'averageEngagementRate'
        : 'subscriberCount'
    filtered.sort((a, b) =>
      sortOrder === 'ASC' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]
    )

    const startIndex = cursor ? parseInt(cursor, 10) : 0
    const content = filtered.slice(startIndex, startIndex + PAGE_SIZE)
    const nextIndex = startIndex + PAGE_SIZE
    const hasNext = nextIndex < filtered.length

    return HttpResponse.json({
      success: true,
      responseDto: {
        content,
        pageInfo: {
          size: PAGE_SIZE,
          numberOfElements: content.length,
          nextCursor: hasNext ? String(nextIndex) : null,
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
  }),

  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/influencers/:channelId/bookmark`,
    ({ params }) => {
      const { channelId } = params
      const influencer = mockInfluencers.find(
        (i) => String(i.channelId) === channelId
      )
      if (!influencer) {
        return HttpResponse.json(
          {
            responseDto: '',
            error: {
              code: 'NOT_FOUND',
              message: '인플루언서를 찾을 수 없습니다.',
            },
            success: false,
          },
          { status: 404 }
        )
      }
      influencer.bookmarked = true
      return HttpResponse.json({
        responseDto: '북마크가 추가되었습니다.',
        error: null,
        success: true,
      })
    }
  ),

  http.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/influencers/:channelId/bookmark`,
    ({ params }) => {
      const { channelId } = params
      const influencer = mockInfluencers.find(
        (i) => String(i.channelId) === channelId
      )
      if (!influencer) {
        return HttpResponse.json(
          {
            responseDto: '',
            error: {
              code: 'NOT_FOUND',
              message: '인플루언서를 찾을 수 없습니다.',
            },
            success: false,
          },
          { status: 404 }
        )
      }
      influencer.bookmarked = false
      return HttpResponse.json({
        responseDto: '북마크가 해제되었습니다.',
        error: null,
        success: true,
      })
    }
  ),
]
