'use client'

import { SocialLoginButtonProps } from './type'
import { cn } from '@/shared/lib/utils'

//구글 로그인, 유튜브 로그인에 따라 다른 아이콘을 보여주고 다른 로직을 수행하는 버튼
export function SocialLoginButton({
  icon,
  label,
  onClick,
  disabled = false,
  className,
  labelClassName,
}: SocialLoginButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex min-h-48 w-full items-center justify-center rounded-6 border border-stroke-border-gray-stronger bg-white px-16 transition-colors disabled:pointer-events-none disabled:opacity-50',
        className
      )}>
      <div className='flex w-full min-w-0 items-center justify-center gap-12'>
        <span className='flex size-[3.5rem] shrink-0 items-center justify-center *:size-full'>
          {icon}
        </span>
        <span
          className={cn(
            'text-center text-noto-label-md-normal break-keep text-text-and-icon-primary',
            labelClassName
          )}>
          {label}
        </span>
      </div>
    </button>
  )
}
