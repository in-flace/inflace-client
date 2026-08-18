import { http, HttpResponse } from 'msw'

import { mockInfluencers } from '@/features/influencer/mock/mockInfluencers'
import { mockYoutubeCategories } from '@/entities/youtubeCategory'

const PAGE_SIZE = 9

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
