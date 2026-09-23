'use client'

import { Suspense, type ReactNode } from 'react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { Button } from '@/shared/ui/button'

interface QueryBoundaryProps {
  fallback: ReactNode
  errorMessage?: string
  children: ReactNode
}

/* useSuspenseQuery를 쓰는 위젯을 감싸는 공통 로딩/에러 경계.
 * 위젯 하나당 하나씩 감싸면 그 위젯만 독립적으로 로딩/에러/재시도된다.
 * resetErrorBoundary → onReset(=reset)이 react-query 에러 상태를 지우고
 * Suspense 자식이 다시 마운트되면서 쿼리가 자동 재시도된다. */
export function QueryBoundary({
  fallback,
  errorMessage = '데이터를 불러오지 못했습니다.',
  children,
}: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <div className='flex w-full flex-col items-center gap-16 rounded-12 bg-white px-24 py-32'>
              <p className='text-noto-body-lg-normal text-text-and-icon-secondary'>
                {errorMessage}
              </p>
              <Button
                color='primary'
                variant='outlined'
                size='md'
                onClick={resetErrorBoundary}>
                다시 시도
              </Button>
            </div>
          )}>
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
