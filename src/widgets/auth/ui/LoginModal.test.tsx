import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { useLoginModal } from '@/features/auth'
import { LoginModal } from './LoginModal'

vi.mock('@/features/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth')>()
  return {
    ...actual,
    usePopupOAuth: vi.fn().mockReturnValue({
      isLoading: false,
      error: null,
      handleClick: vi.fn(),
      reset: vi.fn(),
    }),
  }
})

import { usePopupOAuth } from '@/features/auth'
const mockUsePopupOAuth = vi.mocked(usePopupOAuth)

// LoginModal은 usePopupOAuth를 youtube, google 순서로 두 번 호출한다.
const defaultOAuthState = {
  isLoading: false,
  error: null,
  handleClick: vi.fn(),
  reset: vi.fn(),
}

describe('LoginModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePopupOAuth.mockReturnValue(defaultOAuthState)
  })

  afterEach(() => {
    useLoginModal.setState({ isOpen: false, close: () => useLoginModal.setState({ isOpen: false }) })
  })

  it('isOpen이 true일 때 다이얼로그가 렌더링된다', () => {
    useLoginModal.setState({ isOpen: true })
    render(<LoginModal />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('isOpen이 false일 때 다이얼로그가 렌더링되지 않는다', () => {
    useLoginModal.setState({ isOpen: false })
    render(<LoginModal />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('isOpen이 true일 때 YouTube 로그인 버튼이 표시된다', () => {
    useLoginModal.setState({ isOpen: true })
    render(<LoginModal />)

    expect(screen.getByText('YouTube로 계속하기')).toBeInTheDocument()
  })

  it('isOpen이 true일 때 Google 로그인 버튼이 표시된다', () => {
    useLoginModal.setState({ isOpen: true })
    render(<LoginModal />)

    expect(screen.getByText('Google로 계속하기')).toBeInTheDocument()
  })

  it('google.isLoading이 true이면 Google 버튼 라벨이 "로그인 중..."으로 바뀌고 비활성화된다', () => {
    mockUsePopupOAuth
      .mockReturnValueOnce(defaultOAuthState) // youtube
      .mockReturnValueOnce({ ...defaultOAuthState, isLoading: true }) // google

    useLoginModal.setState({ isOpen: true })
    render(<LoginModal />)

    const googleButton = screen.getByText('로그인 중...').closest('button')
    expect(googleButton).toBeDisabled()
  })

  it('youtube.isLoading이 true이면 YouTube 버튼이 비활성화된다', () => {
    mockUsePopupOAuth
      .mockReturnValueOnce({ ...defaultOAuthState, isLoading: true }) // youtube
      .mockReturnValueOnce(defaultOAuthState) // google

    useLoginModal.setState({ isOpen: true })
    render(<LoginModal />)

    const youtubeButton = screen
      .getByText('YouTube로 계속하기')
      .closest('button')
    expect(youtubeButton).toBeDisabled()
  })

  it('google.error가 있으면 에러 텍스트가 표시된다', () => {
    mockUsePopupOAuth
      .mockReturnValueOnce(defaultOAuthState) // youtube
      .mockReturnValueOnce({
        ...defaultOAuthState,
        error: '팝업이 차단되었습니다.',
      }) // google

    useLoginModal.setState({ isOpen: true })
    render(<LoginModal />)

    expect(screen.getByText('팝업이 차단되었습니다.')).toBeInTheDocument()
  })

  it('onOpenChange(false) 호출(다이얼로그 close) 시 loginModal.close()와 각 OAuth의 reset()이 호출된다', () => {
    const youtubeReset = vi.fn()
    const googleReset = vi.fn()
    mockUsePopupOAuth
      .mockReturnValueOnce({ ...defaultOAuthState, reset: youtubeReset }) // youtube
      .mockReturnValueOnce({ ...defaultOAuthState, reset: googleReset }) // google

    useLoginModal.setState({ isOpen: true, close: vi.fn() })
    render(<LoginModal />)

    // Escape 키는 radix Dialog의 onOpenChange(false)를 트리거한다.
    screen.getByRole('dialog').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    )

    expect(useLoginModal.getState().close).toHaveBeenCalled()
    expect(youtubeReset).toHaveBeenCalled()
    expect(googleReset).toHaveBeenCalled()
  })
})
