import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { QueryBoundary } from './QueryBoundary'

class InsufficientError extends Error {}

function Thrower({ error }: { error: Error }): never {
  throw error
}

function renderBoundary(
  error: Error,
  renderError?: (error: unknown) => React.ReactNode
) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <QueryBoundary fallback={<p>로딩</p>} renderError={renderError}>
        <Thrower error={error} />
      </QueryBoundary>
    </QueryClientProvider>
  )
}

describe('QueryBoundary', () => {
  /* 경계가 잡은 에러를 React가 console.error로 남겨 테스트 출력이 지저분해지는 것을 막는다 */
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderError가 없으면 기본 에러 화면과 다시 시도 버튼을 보여준다', () => {
    renderBoundary(new Error('boom'))

    expect(
      screen.getByText('데이터를 불러오지 못했습니다.')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '다시 시도' })
    ).toBeInTheDocument()
  })

  it('renderError가 화면을 반환하면 기본 화면 대신 그것을 보여준다', () => {
    renderBoundary(new InsufficientError(), (error) =>
      error instanceof InsufficientError ? <p>영상 부족</p> : null
    )

    expect(screen.getByText('영상 부족')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '다시 시도' })
    ).not.toBeInTheDocument()
  })

  it('renderError가 null을 반환하면 기본 에러 화면으로 돌아간다', () => {
    renderBoundary(new Error('boom'), (error) =>
      error instanceof InsufficientError ? <p>영상 부족</p> : null
    )

    expect(
      screen.getByText('데이터를 불러오지 못했습니다.')
    ).toBeInTheDocument()
    expect(screen.queryByText('영상 부족')).not.toBeInTheDocument()
  })
})
