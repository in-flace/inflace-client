import Link, { type LinkProps } from 'next/link'
import LogoSvg from '@/shared/assets/logo.svg'
import { cn } from '@/shared/lib/utils'

interface LogoProps {
  variant?: 'header' | 'footer'
  className?: string
  /** 이동 경로. 어디로 보낼지에 대한 정책은 상위 레이어가 결정한다 */
  href: LinkProps['href']
  ariaLabel: string
}

export const Logo = ({
  variant = 'header',
  className,
  href,
  ariaLabel,
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
