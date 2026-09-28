import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { useAuthStore } from '@/entities/user'
import type { ApproveBrandsRequest } from '@/features/admin'
import { AdminBrandReviewPage } from './AdminBrandReviewPage'

const API = process.env.NEXT_PUBLIC_API_URL_V2
let approvedBody: ApproveBrandsRequest | null = null
let lastBrandQuery: string | null = null

const page = <T,>(content: T[]) => ({
  content,
  totalElements: content.length,
  totalPages: content.length ? 1 : 0,
  number: 0,
})

const server = setupServer(
  http.get(`${API}/admin`, () =>
    HttpResponse.json({
      success: true,
      responseDto: {
        pendingBrands: page([
          {
            id: 42,
            name: '인플레이스',
            videoEvidence: [
              {
                channelBrandId: 7,
                channelName: '테스트 채널',
                matchedAlias: '인플',
                youtubeVideoId: 'video-1',
                youtubeVideoUrl: 'https://youtu.be/video-1',
                videoDescription: '브랜드가 소개된 영상',
              },
            ],
          },
        ]),
      },
      error: null,
    })
  ),
  http.post(`${API}/admin/brands/approve`, async ({ request }) => {
    approvedBody = (await request.json()) as ApproveBrandsRequest
    return HttpResponse.json({ success: true, responseDto: null, error: null })
  }),
  http.get(`${API}/admin/brands`, ({ request }) => {
    lastBrandQuery = new URL(request.url).searchParams.get('query')
    const brands = [
      {
        id: 9,
        name: '검색 브랜드',
        aiGenerated: true,
        adminApproved: true,
        adminReviewStatus: 'APPROVED',
      },
    ]
    return HttpResponse.json({
      success: true,
      responseDto: {
        query: lastBrandQuery ?? '',
        brands: page(lastBrandQuery && lastBrandQuery !== '검색' ? [] : brands),
      },
      error: null,
    })
  })
)

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminBrandReviewPage />
    </QueryClientProvider>
  )
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('AdminBrandReviewPage', () => {
  beforeEach(() => {
    approvedBody = null
    lastBrandQuery = null
    useAuthStore.setState({ accessToken: 'admin-token' })
  })

  it('대기 브랜드를 선택해 원래 이름으로 승인한다', async () => {
    renderPage()

    expect(await screen.findByText('브랜드가 소개된 영상')).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByRole('checkbox', { name: '선택' }))
    await user.click(
      screen.getByRole('button', { name: '선택 항목 일괄 승인 (1)' })
    )

    await waitFor(() =>
      expect(approvedBody).toEqual({
        brandIds: [42],
        brandNames: { 42: '인플레이스' },
        targetBrandIds: {},
      })
    )
  })

  it('완료 내역에서 검색어를 API 쿼리로 보낸다', async () => {
    renderPage()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: '검수 완료 내역' }))
    expect(await screen.findByText('검색 브랜드')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('브랜드 이름 또는 ID'), '검색')
    await user.click(screen.getByRole('button', { name: '검색' }))

    await waitFor(() => expect(lastBrandQuery).toBe('검색'))
  })
})
