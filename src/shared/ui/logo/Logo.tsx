import Link from 'next/link'
import LogoSvg from '@/shared/assets/logo.svg'
import { cn } from '@/shared/lib/utils'

interface LogoProps {
  variant?: 'header' | 'footer'
  className?: string
  href?: string
  ariaLabel?: string
}

export const Logo = ({
  variant = 'header',
  className,
  href = '/',
  ariaLabel = 'inflace 홈으로 이동',
}: LogoProps) => {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center', className)}
      aria-label={ariaLabel}>
      <LogoSvg
        className={cn(
          variant === 'header' && 'h-header-logo w-header-logo',
          variant === 'footer' && 'h-footer-logo w-footer-logo'
        )}
        role='img'
      />
      <span className='sr-only'>inflace</span>
    </Link>
  )
}
