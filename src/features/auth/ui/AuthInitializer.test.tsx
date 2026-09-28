import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'

import { CURRENT_USER_QUERY_KEY, useAuthStore } from '@/entities/user'
import { mockUser } from '@/entities/user/mock/mockUser'
import { useOnboardingModal } from '@/features/onboarding/model/useOnboardingModal'
import { queryClient } from '@/shared/lib/queryClient'
import { AuthInitializer } from './AuthInitializer'

const mockUseAuthInit = vi.fn()

vi.mock('../model/useAuthInit', () => ({
  useAuthInit: () => mockUseAuthInit(),
}))

describe('AuthInitializer', () => {
  beforeEach(() => {
    useAuthStore.getState().reset()
    queryClient.clear()
    useOnboardingModal.getState().close()
  })

  function renderInitializer() {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthInitializer />
      </QueryClientProvider>
    )
  }

  it('마운트 시 useAuthInit을 호출한다', () => {
    renderInitializer()
    expect(mockUseAuthInit).toHaveBeenCalledTimes(1)
  })

  it('UI를 렌더링하지 않는다 (null 반환)', () => {
    const { container } = renderInitializer()
    expect(container.innerHTML).toBe('')
  })

  it('온보딩 미완료 사용자가 복원되면 온보딩 모달을 연다', async () => {
    useAuthStore.getState().setAccessToken('access-token')
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, {
      ...mockUser,
      userDetails: {
        ...mockUser.userDetails,
        isOnboardingCompleted: false,
      },
    })

    renderInitializer()

    await waitFor(() => {
      expect(useOnboardingModal.getState().isOpen).toBe(true)
    })
  })
})
