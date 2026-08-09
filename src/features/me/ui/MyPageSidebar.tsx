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
    <div className='h-fit w-[30.3rem] shrink-0 gap-20 p-24'>
      <div className='flex h-fit w-full gap-4 rounded-8 bg-white p-16 shadow-[0px_2px_6px_0px_#0D0D0D0A]'>
        <ul className='flex h-fit w-full flex-col'>
          {SIDEBAR_ITEMS.map((item) => {
            const isActive =
              currentPath === item.href ||
              (currentPath?.startsWith(item.href + '/') ?? false)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-fit w-full items-center gap-8 rounded-6 p-8',
                    isActive
                      ? 'bg-[#5A44F214] text-noto-label-md-bold text-brand-primary'
                      : 'bg-white text-noto-label-md-thin text-text-and-icon-primary'
                  )}>
                  <item.Icon className='size-[1.8rem]' />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
