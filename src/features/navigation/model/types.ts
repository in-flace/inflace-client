import { UserPlan } from '@/shared/api/types'

export type IconName =
  | 'sidebar'
  | 'dashboard'
  | 'video'
  | 'search'
  | 'chart'
  | 'resing'
  | 'article'
  | 'message'
  | 'question'
  | 'kakao'
  | 'lock'

export interface SidebarIconProps {
  name: IconName
  className?: string
  size?: number | string
}

export interface NavItem {
  id?: string | number
  title: string
  icon?: IconName
  url: string
  requiredPlan?: UserPlan
  requiresAuth?: boolean
  requiresChannel?: boolean
  /* 외부 링크. next/link 대신 새 탭으로 여는 <a>로 렌더링한다. */
  external?: boolean
}

export interface NavGroup {
  id: number
  group: string
  items: NavItem[]
}
