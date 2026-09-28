import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { useAuthStore } from '@/entities/user'
import type { FeedbackStatus } from '@/features/admin'
import { AdminFeedbackPage } from './AdminFeedbackPage'

const API = process.env.NEXT_PUBLIC_API_URL_V2
let status: FeedbackStatus = 'UNCONFIRMED'
let lastStatusQuery: string | null = null

const server = setupServer(
  http.get(`${API}/admin/feedbacks`, ({ request }) => {
    lastStatusQuery = new URL(request.url).searchParams.get('status')
    const visible = !lastStatusQuery || lastStatusQuery === status

    return HttpResponse.json({
      success: true,
      responseDto: {
        totalCount: 1,
        unconfirmedCount: status === 'UNCONFIRMED' ? 1 : 0,
        confirmedCount: status === 'CONFIRMED' ? 1 : 0,
        onHoldCount: status === 'ON_HOLD' ? 1 : 0,
        feedbacks: {
          content: visible
            ? [
                {
                  id: 17,
                  ip: '127.0.0.1',
                  content: '검색 결과가 이상해요',
                  status,
                  submissionLocation: '/competitor',
                  createdAt: '2026-09-23T10:30:00+09:00',
                },
              ]
            : [],
          totalElements: visible ? 1 : 0,
          totalPages: visible ? 1 : 0,
          number: 0,
        },
      },
      error: null,
    })
  }),
  http.patch(`${API}/admin/feedbacks/:id/status`, async ({ params, request }) => {
    expect(params.id).toBe('17')
    status = ((await request.json()) as { status: FeedbackStatus }).status
    return HttpResponse.json({ success: true, responseDto: null, error: null })
  })
)

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminFeedbackPage />
    </QueryClientProvider>
  )
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('AdminFeedbackPage', () => {
  beforeEach(() => {
    status = 'UNCONFIRMED'
    lastStatusQuery = null
    useAuthStore.setState({ accessToken: 'admin-token' })
  })

  it('피드백을 조회하고 상태 탭으로 필터링한다', async () => {
    renderPage()

    expect(await screen.findByText('검색 결과가 이상해요')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: '보류 0' }))

    await waitFor(() => expect(lastStatusQuery).toBe('ON_HOLD'))
    expect(await screen.findByText('접수된 문의가 없습니다.')).toBeInTheDocument()
  })

  it('피드백 상태를 변경하고 목록을 다시 조회한다', async () => {
    renderPage()

    const row = (await screen.findByText('CS-17')).closest('tr')!
    await userEvent.setup().click(
      within(row).getByRole('button', { name: '확인 완료' })
    )

    await waitFor(() => expect(status).toBe('CONFIRMED'))
    await waitFor(() =>
      expect(within(row).getByRole('button', { name: '확인 완료' })).toBeDisabled()
    )
  })
})
