import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useLoginModal } from '@/features/auth'
import { useAuthStore } from '@/shared/api/authStore'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/competitor',
  useSearchParams: () => new URLSearchParams(),
}))

/* 하위 컴포넌트의 조회 실패가 401 인터셉터를 타면 모달이 열려 검증이 오염된다 */
vi.mock('@/shared/api/axiosInstance', () => ({
  axiosInstance: {
    get: vi.fn(() => Promise.reject(new Error('network disabled in test'))),
    post: vi.fn(() => Promise.reject(new Error('network disabled in test'))),
  },
}))

const { fetchNextPage, refetch, useBrandCollaborations } = vi.hoisted(() => ({
  fetchNextPage: vi.fn(),
  refetch: vi.fn(),
  useBrandCollaborations: vi.fn(),
}))

/* hasNextPage를 켜야 '결과 더보기'가 렌더된다 */
vi.mock('@/features/competitor', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/competitor')>()
  return {
    ...actual,
    useBrandCollaborations,
  }
})

import { CompetitorPage } from './CompetitorPage'

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <CompetitorPage />
    </QueryClientProvider>
  )
}

function clickButton(name: string) {
  return userEvent.setup().click(screen.getByRole('button', { name }))
}

function clickSearch() {
  return clickButton('검색하기')
}

describe('CompetitorPage', () => {
  beforeEach(() => {
    fetchNextPage.mockClear()
    refetch.mockClear()
    useBrandCollaborations.mockClear()
    useBrandCollaborations.mockReturnValue({
      data: undefined,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
      refetch,
    })
    useLoginModal.getState().close()
    useAuthStore.setState({
      accessToken: null,
      user: null,
      isInitializing: false,
    })
  })

  it('미로그인 상태에서 검색하기를 누르면 로그인 모달이 열린다', async () => {
    renderPage()

    await clickSearch()

    expect(useLoginModal.getState().isOpen).toBe(true)
  })

  it('로그인 상태에서 검색하기는 모달을 열지 않는다', async () => {
    useAuthStore.setState({ accessToken: 'access-token' })
    renderPage()

    await clickSearch()

    expect(useLoginModal.getState().isOpen).toBe(false)
  })

  it('새 키워드 검색은 적용 필터만 변경하고 기존 쿼리를 재호출하지 않는다', async () => {
    useAuthStore.setState({ accessToken: 'access-token' })
    renderPage()
    const user = userEvent.setup()

    await user.type(
      screen.getByPlaceholderText(
        '검색에 포함할 키워드를 입력해주세요 (최대 5개)'
      ),
      '갤럭시{Enter}'
    )
    await user.type(
      screen.getByPlaceholderText(
        '검색에서 제외할 키워드를 입력해주세요 (최대 5개)'
      ),
      '아이폰{Enter}'
    )
    await user.click(screen.getByRole('button', { name: '검색하기' }))

    expect(refetch).not.toHaveBeenCalled()
    expect(useBrandCollaborations).toHaveBeenLastCalledWith({
      filter: expect.objectContaining({
        includeKeywords: ['갤럭시'],
        excludeKeywords: ['아이폰'],
      }),
    })
  })

  it('동일 조건 재검색은 현재 쿼리만 한 번 재호출한다', async () => {
    useAuthStore.setState({ accessToken: 'access-token' })
    renderPage()

    await clickSearch()

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('auth 초기화 중에는 막지 않는다 (미로그인이면 401 인터셉터가 처리)', async () => {
    useAuthStore.setState({ isInitializing: true })
    renderPage()

    await clickSearch()

    expect(useLoginModal.getState().isOpen).toBe(false)
  })

  it('미로그인 상태에서 결과 더보기는 모달을 열고 다음 페이지를 받지 않는다', async () => {
    renderPage()

    await clickButton('결과 더보기')

    expect(useLoginModal.getState().isOpen).toBe(true)
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('로그인 상태에서 결과 더보기는 다음 페이지를 받는다', async () => {
    useAuthStore.setState({ accessToken: 'access-token' })
    renderPage()

    await clickButton('결과 더보기')

    expect(useLoginModal.getState().isOpen).toBe(false)
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })
})
