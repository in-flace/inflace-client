import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { useBookmarkToggle } from './useInfluencers'
import { addBookmark, removeBookmark } from '../api/influencerApi'

/* 북마크는 응답을 기다리지 않고 캐시를 먼저 바꾼다(낙관적 갱신).
 * 그래서 실패했을 때 되돌아오는지가 핵심이다. 되돌리지 않으면 화면은 저장된
 * 것처럼 남고 사용자는 새로고침 전까지 알 수 없다. */

vi.mock('../api/influencerApi', () => ({
  addBookmark: vi.fn(),
  removeBookmark: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: vi.fn() }))

const CHANNEL_ID = 42

function makeListPage(bookmarked: boolean) {
  return {
    pages: [
      {
        content: [
          { channelId: CHANNEL_ID, channelName: '테스트 채널', bookmarked },
          { channelId: 99, channelName: '다른 채널', bookmarked: false },
        ],
        pageInfo: {
          size: 9,
          numberOfElements: 2,
          nextCursor: null,
          hasNext: false,
        },
      },
    ],
    pageParams: [null],
  }
}

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function readBookmarked() {
  const data = queryClient.getQueryData<ReturnType<typeof makeListPage>>([
    'influencers',
    undefined,
  ])
  return data?.pages[0].content[0].bookmarked
}

describe('useBookmarkToggle', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    })
    queryClient.setQueryData(['influencers', undefined], makeListPage(false))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('요청이 끝나기 전에 캐시를 먼저 바꾼다', async () => {
    vi.mocked(addBookmark).mockImplementation(
      () => new Promise(() => {}) // 응답이 오지 않는 상태를 만든다
    )

    const { result } = renderHook(() => useBookmarkToggle(), { wrapper })
    result.current(CHANNEL_ID, true)

    await waitFor(() => expect(readBookmarked()).toBe(true))
  })

  it('요청이 실패하면 이전 상태로 되돌린다', async () => {
    vi.mocked(addBookmark).mockRejectedValue(new Error('네트워크 오류'))

    const { result } = renderHook(() => useBookmarkToggle(), { wrapper })
    result.current(CHANNEL_ID, true)

    /* 낙관적 갱신 자체는 위 테스트가 덮는다. 여기서는 되돌림만 본다 —
     * 즉시 reject되면 중간 상태를 관찰할 틈이 없어 순서대로 단언할 수 없다. */
    await waitFor(() => expect(readBookmarked()).toBe(false))
  })

  /* HTTP 200으로 오면서 success: false로 실패를 알리는 응답이 있다.
   * axios가 예외를 던지지 않으므로 직접 실패로 만들지 않으면 되돌림이 동작하지 않는다. */
  it('success가 false면 성공으로 보지 않고 되돌린다', async () => {
    vi.mocked(addBookmark).mockResolvedValue({
      responseDto: '',
      error: { code: 'FORBIDDEN', message: '권한이 없습니다.' },
      success: false,
    })

    const { result } = renderHook(() => useBookmarkToggle(), { wrapper })
    result.current(CHANNEL_ID, true)

    await waitFor(() => expect(readBookmarked()).toBe(false))
  })

  it('해제도 실패하면 되돌린다', async () => {
    queryClient.setQueryData(['influencers', undefined], makeListPage(true))
    vi.mocked(removeBookmark).mockRejectedValue(new Error('네트워크 오류'))

    const { result } = renderHook(() => useBookmarkToggle(), { wrapper })
    result.current(CHANNEL_ID, false)

    await waitFor(() => expect(readBookmarked()).toBe(true))
  })

  it('다른 인플루언서는 건드리지 않는다', async () => {
    vi.mocked(addBookmark).mockRejectedValue(new Error('네트워크 오류'))

    const { result } = renderHook(() => useBookmarkToggle(), { wrapper })
    result.current(CHANNEL_ID, true)

    await waitFor(() => expect(readBookmarked()).toBe(false))
    const data = queryClient.getQueryData<ReturnType<typeof makeListPage>>([
      'influencers',
      undefined,
    ])
    expect(data?.pages[0].content[1].bookmarked).toBe(false)
  })
})
