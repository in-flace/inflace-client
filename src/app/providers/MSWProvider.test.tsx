import { StrictMode } from 'react'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { start } = vi.hoisted(() => ({ start: vi.fn() }))

vi.mock('@/shared/api/msw/browser', () => ({ worker: { start } }))

describe('MSWProvider', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_ENABLED', 'true')
    vi.resetModules()
    start.mockResolvedValue(undefined)
    delete (
      globalThis as typeof globalThis & { __inflaceMswStart?: Promise<unknown> }
    ).__inflaceMswStart
  })

  afterEach(() => vi.unstubAllEnvs())

  it('StrictMode에서도 worker를 한 번만 시작한다', async () => {
    const { MSWProvider } = await import('./MSWProvider')

    render(
      <StrictMode>
        <MSWProvider>준비 완료</MSWProvider>
      </StrictMode>
    )

    expect(await screen.findByText('준비 완료')).toBeInTheDocument()
    expect(start).toHaveBeenCalledTimes(1)
  })
})
