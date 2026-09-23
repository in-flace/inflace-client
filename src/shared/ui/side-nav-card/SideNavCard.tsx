'use client'

import type { ComponentType, SVGProps } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/utils'

export type SideNavItem = {
  label: string
  href: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

type Props = {
  items: readonly SideNavItem[]
}

/* 마이페이지·어드민처럼 글로벌 사이드바를 접고 콘텐츠 영역 왼쪽에 두는 서브 내비 카드.
 * Figma "side navigation" 컴포넌트 하나를 두 곳에서 쓰므로 여기서 공유한다. */
export function SideNavCard({ items }: Props) {
  const currentPath = usePathname()
  return (
    <div className='h-fit w-[30.3rem] shrink-0 gap-20 p-24'>
      <div className='flex h-fit w-full gap-4 rounded-8 bg-white p-16 shadow-[0px_2px_6px_0px_#0D0D0D0A]'>
        <ul className='flex h-fit w-full flex-col'>
          {items.map((item) => {
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
