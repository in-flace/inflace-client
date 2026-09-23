'use client'

import { useEffect, useState } from 'react'

// NEXT_PUBLIC_MOCK_ENABLED가 'true'가 아닌 경우 즉시 ready → 배포 환경에서 블로킹 없음
const isMockEnabled = process.env.NEXT_PUBLIC_MOCK_ENABLED === 'true'

function enableMocking() {
  if (!isMockEnabled) return Promise.resolve()

  const scope = globalThis as typeof globalThis & {
    __inflaceMswStart?: Promise<unknown>
  }
  // StrictMode와 Fast Refresh에서도 같은 worker 초기화 작업을 공유한다.
  return (scope.__inflaceMswStart ??= import('@/shared/api/msw/browser').then(
    ({ worker }) => worker.start({ onUnhandledRequest: 'bypass' })
  ))
}

export function MSWProvider({ children }: { children: React.ReactNode }) {
  // mock 비활성화 시 ready=true로 초기화 → 배포 환경에서 렌더 블로킹 없음
  const [ready, setReady] = useState(!isMockEnabled)

  useEffect(() => {
    enableMocking().then(() => setReady(true))
  }, [])

  if (!ready) return null

  return <>{children}</>
}
