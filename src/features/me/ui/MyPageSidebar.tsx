'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/utils'
import UserIcon from '@/shared/assets/user-bold.svg'
import PaymentIcon from '@/shared/assets/payment-bold.svg'
import BellIcon from '@/shared/assets/bell-bold.svg'

export const SIDEBAR_ITEMS = [
  { label: '프로필 설정', href: '/me/profile', Icon: UserIcon },
  { label: '구독·결제', href: '/me/credit', Icon: PaymentIcon },
  { label: '알림 설정', href: '/me/alarm', Icon: BellIcon },
] as const

export function MyPageSidebar() {
  const currentPath = usePathname()
  return (
    <aside className='h-fit w-full shrink-0 p-16 lg:w-[30.3rem] lg:p-24'>
      <div className='flex h-fit w-full gap-4 rounded-8 bg-white p-16 shadow-[0px_2px_6px_0px_#0D0D0D0A]'>
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
                    'flex h-full min-h-36 w-full items-center justify-center gap-6 rounded-6 p-8 text-center lg:justify-start lg:gap-8 lg:text-left',
                    isActive
                      ? 'bg-[#5A44F214] text-noto-label-md-bold text-brand-primary'
                      : 'bg-white text-noto-label-md-thin text-text-and-icon-primary'
                  )}>
                  <item.Icon className='hidden size-[1.8rem] sm:block' />
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
