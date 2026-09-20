'use client'

import { SideNavCard } from '@/shared/ui/side-nav-card'
import UserIcon from '@/shared/assets/user-bold.svg'
// 젝트 광고 기간 동안 구독·결제 탭 노출 중단 — 임시 주석 처리
// import PaymentIcon from '@/shared/assets/payment-bold.svg'
import BellIcon from '@/shared/assets/bell-bold.svg'

export const SIDEBAR_ITEMS = [
  { label: '프로필 설정', href: '/me/profile', Icon: UserIcon },
  // { label: '구독·결제', href: '/me/credit', Icon: PaymentIcon },
  { label: '알림 설정', href: '/me/alarm', Icon: BellIcon },
] as const

export function MyPageSidebar() {
  return <SideNavCard items={SIDEBAR_ITEMS} />
}
