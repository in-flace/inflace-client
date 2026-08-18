import { SidebarMenuItem, SidebarMenuButton } from '@/shared/ui/shadcn/sidebar'
import { SidebarIcon } from '@/features/navigation/ui/NavSidebarIcon'
import type { NavItem } from '../model/types'
import Link from 'next/link'

interface LockedNavItemProps {
  item: NavItem
}

export const NavLockedItem = ({ item }: LockedNavItemProps) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton className='h-[3.6rem] rounded-8 px-[1.2rem] py-0'>
        <Link href={item.url} className='flex h-full w-full items-center gap-8'>
          {item.icon && (
            <SidebarIcon
              name={item.icon}
              className='shrink-0 transition-colors [&>path]:fill-current'
              size={18}
            />
          )}
          <span className='flex-1 whitespace-nowrap'>{item.title}</span>
          <SidebarIcon
            name={'lock'}
            className='ml-auto shrink-0 [&_path]:fill-stroke-border-gray-stronger'
            size={16}
          />
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
