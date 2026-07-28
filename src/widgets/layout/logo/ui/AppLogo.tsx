'use client'

import { useAuth } from '@/features/auth'
import { Logo } from '@/shared/ui/logo'

interface AppLogoProps {
  variant?: 'header' | 'footer'
  className?: string
}

/**
 * 로고 클릭은 "서비스 시작점으로 이동"을 의미한다.
 * 시작점은 인증 상태에 따라 달라지므로(로그인 시 랜딩(/)을 경유하지 않고 /main으로 직접),
 * 경로 결정은 사용처가 아닌 이곳에서 일괄 처리한다.
 */
export const AppLogo = ({ variant = 'header', className }: AppLogoProps) => {
  const { isLoggedIn } = useAuth()

  return (
    <Logo
      variant={variant}
      className={className}
      href={isLoggedIn ? '/main' : '/'}
      ariaLabel={isLoggedIn ? 'inflace 메인으로 이동' : 'inflace 홈으로 이동'}
    />
  )
}
