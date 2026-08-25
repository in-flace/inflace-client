'use client'

import { Sidebar, SidebarContent } from '@/shared/ui/shadcn/sidebar'
import { NavGroupList } from '@/features/navigation/ui/NavGroupList'
import { ChannelStatusCard } from '@/features/navigation/ui/ChannelStatusCard'

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent className='mt-header-height w-full flex-col items-stretch gap-20 overscroll-contain px-16 py-16'>
        <ChannelStatusCard />

        <NavGroupList />
      </SidebarContent>
    </Sidebar>
  )
}
