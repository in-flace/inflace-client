'use client'

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/shared/ui/shadcn/sidebar'

import { SUPPORT_NAV_GROUP } from '../model/navItems'
import { NavMenuItem } from './NavMenuItem'

/* 사이드바 하단에 고정되는 고객센터 그룹.
 * mt-auto가 위 그룹들과의 남는 공간을 모두 차지해 아래로 밀어낸다. */
export function SupportNavGroup() {
  return (
    <SidebarGroup className='mt-auto border-t border-stroke-divider pt-16 pb-16'>
      <SidebarGroupLabel>{SUPPORT_NAV_GROUP.group}</SidebarGroupLabel>
      <SidebarMenu>
        {SUPPORT_NAV_GROUP.items.map((item) => (
          <NavMenuItem key={item.title} item={item} isActive={false} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
