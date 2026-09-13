import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import YouTubeIcon from '@/shared/assets/youtube.svg'
import { SocialLoginButton } from './SocialLoginButton'

const TestIcon = () => <YouTubeIcon data-testid='test-icon' />

describe('SocialLoginButton', () => {
  it('label prop 텍스트가 버튼에 렌더링된다', () => {
    render(
      <SocialLoginButton icon={<TestIcon />} label='Continue with Google' />
    )
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('icon ReactNode가 버튼 내부에 렌더링된다', () => {
    render(<SocialLoginButton icon={<TestIcon />} label='Test' />)
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('클릭 시 onClick이 호출된다', async () => {
    const handleClick = vi.fn()
    render(
      <SocialLoginButton
        icon={<TestIcon />}
        label='Test'
        onClick={handleClick}
      />
    )

    await userEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disabled 시 버튼에 disabled 속성이 적용된다', () => {
    render(<SocialLoginButton icon={<TestIcon />} label='Test' disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('disabled 시 클릭해도 onClick이 호출되지 않는다', async () => {
    const handleClick = vi.fn()
    render(
      <SocialLoginButton
        icon={<TestIcon />}
        label='Test'
        onClick={handleClick}
        disabled
      />
    )

    await userEvent.click(screen.getByRole('button'))

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('disabled 미전달 시 기본값 false로 동작한다', () => {
    render(<SocialLoginButton icon={<TestIcon />} label='Test' />)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })
})
