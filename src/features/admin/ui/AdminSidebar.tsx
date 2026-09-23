'use client'

import { SideNavCard } from '@/shared/ui/side-nav-card'
import LightbulbAiIcon from '@/shared/assets/lightbulb-ai-bold.svg'
import FeedbackIcon from '@/shared/assets/feedback-bold.svg'

// "활동 확인" 메뉴는 Figma·API 모두 미정이라 제외. 생기면 여기에 한 줄 추가
export const ADMIN_SIDEBAR_ITEMS = [
  { label: 'AI 브랜드 검수', href: '/admin/brands', Icon: LightbulbAiIcon },
  { label: 'CS 관리', href: '/admin/feedbacks', Icon: FeedbackIcon },
] as const

export function AdminSidebar() {
  return <SideNavCard items={ADMIN_SIDEBAR_ITEMS} />
}
