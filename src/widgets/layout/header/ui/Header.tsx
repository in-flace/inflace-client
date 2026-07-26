'use client'

import { LoginButton } from '@/features/auth'
import { useAuth } from '@/features/auth/model/useAuth'

import { Logo } from '@/shared/ui/logo'

export function Header() {
  const { isLoggedIn } = useAuth()

  return (
    <>
      <header className='sticky top-0 z-11 h-header-height'>
        <div className='absolute top-0 left-0 flex h-header-height w-full items-center border-b border-sidebar-border bg-white px-34'>
          <div className='flex shrink-0 basis-full items-center justify-between'>
            {/* 로그인 상태에서는 랜딩(/)을 경유하지 않도록 /main으로 직접 보낸다 */}
            <Logo
              variant='header'
              href={isLoggedIn ? '/main' : '/'}
              ariaLabel={
                isLoggedIn ? 'inflace 메인으로 이동' : 'inflace 홈으로 이동'
              }
            />
            <div className='flex items-center gap-x-16'>
              <LoginButton />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
