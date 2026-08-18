import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { trackEvent } from '@/shared/analytics'
import { useOnboarding } from './useOnboarding'
import { postOnboarding } from '../api/onboardingApi'

vi.mock('@/shared/analytics', () => ({ trackEvent: vi.fn() }))
vi.mock('../api/onboardingApi', () => ({ postOnboarding: vi.fn() }))

/* 화면은 서버 저장이 실패해도 모달을 닫는다
 * (OnboardingActionButtons의 .finally(close)).
 * UI 기준으로 완료를 세면 실제보다 부풀려지므로, 저장 성공에만 보내야 한다. */

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const VARIABLES = {
  roles: ['YOUTUBER'] as never,
  needs: [] as never,
  method: 'skip' as const,
}

describe('useOnboarding 계측', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    vi.clearAllMocks()
  })

  it('저장에 성공하면 완료 이벤트를 보낸다', async () => {
    vi.mocked(postOnboarding).mockResolvedValue({} as never)

    const { result } = renderHook(() => useOnboarding(), { wrapper })
    result.current.mutate(VARIABLES)

    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith({
        event: 'onboarding_completed',
        method: 'skip',
      })
    )
  })

  it('저장에 실패하면 보내지 않는다', async () => {
    vi.mocked(postOnboarding).mockRejectedValue(new Error('서버 오류'))

    const { result } = renderHook(() => useOnboarding(), { wrapper })
    result.current.mutate(VARIABLES)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(trackEvent).not.toHaveBeenCalled()
  })

  it('유튜브 연동 경로는 method로 구분된다', async () => {
    vi.mocked(postOnboarding).mockResolvedValue({} as never)

    const { result } = renderHook(() => useOnboarding(), { wrapper })
    result.current.mutate({ ...VARIABLES, method: 'youtube_connect' })

    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith({
        event: 'onboarding_completed',
        method: 'youtube_connect',
      })
    )
  })
})
