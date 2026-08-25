import { SidebarMenuItem, SidebarMenuButton } from '@/shared/ui/shadcn/sidebar'
import { SidebarIcon } from '@/features/navigation/ui/NavSidebarIcon'
import { useLoginModal } from '@/features/auth/model/useLoginModal'
import { useYoutubeConnectModal } from '@/features/auth/model/useYoutubeConnectModal'
import { useAuth } from '@/features/auth/model/useAuth'
import type { NavItem } from '../model/types'
import Link from 'next/link'
import { cn } from '@/shared/lib/utils'

interface NavMenuItemProps {
  item: NavItem
  isActive: boolean
}

export const NavMenuItem = ({ item, isActive }: NavMenuItemProps) => {
  const { isLoggedIn, user } = useAuth()
  const openLoginModal = useLoginModal((s) => s.open)
  const openYoutubeConnectModal = useYoutubeConnectModal((s) => s.open)

  const isChannelConnected = Boolean(
    user?.userChannelDetails?.youtubeChannelId &&
    user?.userChannelDetails?.youtubeChannelName
  )

  const handleClick = (e: React.MouseEvent) => {
    if (item.requiresAuth && !isLoggedIn) {
      e.preventDefault()
      openLoginModal('nav_menu')
      return
    }
    if (item.requiresChannel && !isChannelConnected) {
      e.preventDefault()
      openYoutubeConnectModal()
    }
  }

  const content = (
    <>
      {item.icon && (
        <SidebarIcon
          name={item.icon}
          className='shrink-0 [&>path]:fill-current'
          size={18}
        />
      )}
      <span className='whitespace-nowrap'>{item.title}</span>
    </>
  )

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={cn(
          'h-[3.6rem] rounded-8 px-[1.2rem] py-0',
          isActive
            ? 'bg-btn-primary-outlined-hover text-brand-primary'
            : 'bg-white text-text-and-icon-primary'
        )}>
        {/* 외부 링크는 라우팅 대상이 아니라 next/link로 감싸지 않는다.
         * noreferrer까지 붙여야 새 탭에서 window.opener 접근이 막힌다. */}
        {item.external ? (
          <a
            href={item.url}
            target='_blank'
            rel='noopener noreferrer'
            className='flex h-full w-full items-center gap-8'>
            {content}
          </a>
        ) : (
          <Link
            href={item.url}
            className='flex h-full w-full items-center gap-8'
            onClick={handleClick}>
            {content}
          </Link>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
