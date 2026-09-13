import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { mockUser } from '@/entities/user/mock/mockUser'
import { LoginButton } from './LoginButton'

const mockLogout = vi.fn()
const mockOpenModal = vi.fn()

vi.mock('../model/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../model/useLoginModal', () => ({
  useLoginModal: vi.fn(),
}))

vi.mock('@/entities/user', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/user')>()
  return {
    ...actual,
    UserIcon: () => <div data-testid='user-avatar' />,
  }
})

import { useAuth } from '../model/useAuth'
import { useLoginModal } from '../model/useLoginModal'
import type { LoginModalState } from '../model/types'

const mockUseAuth = vi.mocked(useAuth)
const mockUseLoginModal = vi.mocked(useLoginModal)

describe('LoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLoginModal.mockImplementation((selector: (state: LoginModalState) => unknown) =>
      selector({ isOpen: false, open: mockOpenModal, close: vi.fn() })
    )
  })

  it('초기화 중일 때 disabled된 "로딩중..." 버튼을 렌더링한다', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: false,
      isInitializing: true,
      user: null,
      logout: mockLogout,
    })

    render(<LoginButton />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('로딩중...')
  })

  it('로그인 상태일 때 "로그아웃" 버튼을 렌더링한다', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: true,
      isInitializing: false,
      user: mockUser,
      logout: mockLogout,
    })

    render(<LoginButton />)

    expect(screen.getByText('로그아웃')).toBeInTheDocument()
  })

  it('로그인 상태일 때 UserAvatar를 렌더링한다', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: true,
      isInitializing: false,
      user: mockUser,
      logout: mockLogout,
    })

    render(<LoginButton />)

    expect(screen.getByTestId('user-avatar')).toBeInTheDocument()
  })

  it('로그인 상태에서 로그아웃 버튼 클릭 시 logout이 호출된다', async () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: true,
      isInitializing: false,
      user: null,
      logout: mockLogout,
    })

    render(<LoginButton />)
    await userEvent.click(screen.getByText('로그아웃'))

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('비로그인 상태일 때 "로그인" 버튼을 렌더링한다', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: false,
      isInitializing: false,
      user: null,
      logout: mockLogout,
    })

    render(<LoginButton />)

    expect(screen.getByText('로그인')).toBeInTheDocument()
  })

  it('비로그인 상태에서 로그인 버튼 클릭 시 로그인 모달을 오픈한다', async () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: false,
      isInitializing: false,
      user: null,
      logout: mockLogout,
    })

    render(<LoginButton />)
    await userEvent.click(screen.getByText('로그인'))

    expect(mockOpenModal).toHaveBeenCalledTimes(1)
  })
})
