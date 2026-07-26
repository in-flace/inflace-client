'use client'

import Link from 'next/link'
import { useAuth } from '@/features/auth/model/useAuth'
import { Logo } from '@/shared/ui/logo'

export const FooterInfo = () => {
  const { isLoggedIn } = useAuth()

  return (
    <div className='flex flex-col self-stretch'>
      {/* 로그인 상태에서는 랜딩(/)을 경유하지 않도록 /main으로 직접 보낸다 */}
      <Logo
        variant='footer'
        href={isLoggedIn ? '/main' : '/'}
        ariaLabel={isLoggedIn ? 'inflace 메인으로 이동' : 'inflace 홈으로 이동'}
      />
      <div className='flex-1' />
      <div className='flex flex-col gap-y-xs'>
        <ul className='flex gap-sm'>
          <li className='text-noto-label-md-normal text-text-and-icon-primary'>
            <Link href='/privacy'>개인정보처리방침</Link>
          </li>
          <li className='text-noto-label-md-normal text-text-and-icon-primary'>
            <Link href='/terms'>이용약관</Link>
          </li>
        </ul>
        <p className='text-noto-caption-md-normal text-text-and-icon-tertiary'>
          ⓒ 2026. inflace All rights reserved.
        </p>
      </div>
    </div>
  )
}
