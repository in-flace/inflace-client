'use client'

import { LoginButton } from '@/features/auth'

import { AppLogo } from '@/widgets/layout/logo'

export function Header() {
  return (
    <>
      <header className='sticky top-0 z-11 h-header-height'>
        <div className='absolute top-0 left-0 flex h-header-height w-full items-center border-b border-sidebar-border bg-white pr-20 pl-56 sm:pr-34 sm:pl-64 md:px-34'>
          <div className='flex shrink-0 basis-full items-center justify-between'>
            <AppLogo variant='header' />
            <div className='flex items-center gap-x-16'>
              <LoginButton />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
