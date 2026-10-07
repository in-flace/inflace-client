'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/utils'
import UserIcon from '@/shared/assets/user-thin.svg'
import PaymentIcon from '@/shared/assets/payment-thin.svg'
import BellIcon from '@/shared/assets/bell-thin.svg'

export const SIDEBAR_ITEMS = [
  { label: '프로필 설정', href: '/me/profile', Icon: UserIcon },
  { label: '구독 · 결제', href: '/me/credit', Icon: PaymentIcon },
  { label: '알림 설정', href: '/me/alarm', Icon: BellIcon },
] as const

export function MyPageSidebar() {
  const currentPath = usePathname()
  return (
    <aside className='h-fit w-full shrink-0 p-16 lg:w-[30.3rem] lg:p-24'>
      <div className='flex h-fit w-full gap-4 rounded-8 bg-white p-16 shadow-[0px_2px_6px_0px_#0D0D0D0A,0px_6px_12px_0px_#0D0D0D0A]'>
        <ul className='grid h-fit w-full grid-cols-3 gap-4 lg:flex lg:flex-col'>
          {SIDEBAR_ITEMS.map((item) => {
            const isActive =
              currentPath === item.href ||
              (currentPath?.startsWith(item.href + '/') ?? false)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    /* spacing 스케일에 36이 없어 min-h-36은 Tailwind 기본 배수(0.25rem*36=9rem)로
                     * 폴백해 90px가 된다. 시안의 36px를 지키려면 임의값으로 지정해야 한다. */
                    'flex h-full min-h-[3.6rem] w-full items-center justify-center gap-6 rounded-6 p-8 text-center lg:justify-start lg:gap-8 lg:text-left',
                    isActive
                      ? 'bg-[#5A44F214] text-noto-label-md-bold text-brand-primary'
                      : 'bg-white text-noto-label-md-thin text-text-and-icon-primary'
                  )}>
                  <item.Icon
                    className={cn(
                      /* 시안은 아이콘만 한 단계 연한 색을 쓴다. SVG가
                       * currentColor라 부모 텍스트 색을 따라가므로 따로 지정한다. */
                      'hidden size-[1.8rem] sm:block',
                      isActive
                        ? 'text-brand-primary'
                        : 'text-text-and-icon-secondary'
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
