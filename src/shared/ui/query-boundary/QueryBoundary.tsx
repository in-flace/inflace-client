'use client'

import { Suspense, type ReactNode } from 'react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { Button } from '@/shared/ui/button'

interface QueryBoundaryProps {
  fallback: ReactNode
  errorMessage?: string
  /* 특정 에러를 기본 "다시 시도" 화면 대신 다르게 그릴 때 쓴다.
   * 재시도해도 결과가 같은 에러(예: 데이터 부족 400)에 재시도 버튼을 보이지 않기 위함.
   * null/undefined를 반환하면 기본 화면을 쓴다. */
  renderError?: (error: unknown) => ReactNode
  children: ReactNode
}

/* useSuspenseQuery를 쓰는 위젯을 감싸는 공통 로딩/에러 경계.
 * 위젯 하나당 하나씩 감싸면 그 위젯만 독립적으로 로딩/에러/재시도된다.
 * resetErrorBoundary → onReset(=reset)이 react-query 에러 상태를 지우고
 * Suspense 자식이 다시 마운트되면서 쿼리가 자동 재시도된다. */
export function QueryBoundary({
  fallback,
  errorMessage = '데이터를 불러오지 못했습니다.',
  renderError,
  children,
}: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) =>
            renderError?.(error) ?? (
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
            )
          }>
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
