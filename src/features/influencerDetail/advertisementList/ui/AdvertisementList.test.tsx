import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import type { AdvertisementListResponseDto } from '../model/types'
import { fetchInfluencerBrand } from '../api/influencerBrandApi'
import { AdvertisementList } from './AdvertisementList'

vi.mock('../api/influencerBrandApi')

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)

const mockFetch = vi.mocked(fetchInfluencerBrand)

const emptyPage: AdvertisementListResponseDto = {
  content: [],
  pageInfo: { size: 9, numberOfElements: 0, nextCursor: null, hasNext: false },
  sort: { sorted: true, sortCriteria: 'LATEST', sortOrder: 'DESC' },
}

const FILTER = {
  startDate: '2026-06-30T15:00:00.000Z',
  endDate: '2026-07-29T14:59:59.000Z',
  categoryId: '20',
}

function renderList(filter?: typeof FILTER) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AdvertisementList channelId='ch-1' filter={filter} />
    </QueryClientProvider>
  )
}

describe('AdvertisementList 조회 조건', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue(emptyPage)
  })

  /* 지표(/analysis)에는 검색 필터가 가는데 목록에는 안 가서 두 패널의
   * 대상 기간이 어긋나던 회귀를 막는다 */
  it('검색 필터의 기간·카테고리를 목록 조회에 함께 보낸다', async () => {
    renderList(FILTER)

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())

    expect(mockFetch).toHaveBeenCalledWith(
      'ch-1',
      expect.objectContaining({
        startDate: FILTER.startDate,
        endDate: FILTER.endDate,
        categoryId: FILTER.categoryId,
        videoFormat: 'ALL',
        sortCriteria: 'LATEST',
        sortOrder: 'DESC',
      })
    )
  })

  it('필터가 없으면 기간·카테고리 없이 조회한다', async () => {
    renderList()

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())

    const params = mockFetch.mock.calls[0]?.[1]
    expect(params?.startDate).toBeUndefined()
    expect(params?.endDate).toBeUndefined()
    expect(params?.categoryId).toBeUndefined()
  })
})
