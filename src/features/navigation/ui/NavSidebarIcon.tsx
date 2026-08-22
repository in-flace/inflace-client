import IconSidebar from '@/shared/assets/rightwards-menu-thin.svg'
import IconDashboard from '@/shared/assets/dashboard-bold.svg'
import IconVideo from '@/shared/assets/video-bold.svg'
import IconSearch from '@/shared/assets/search-bold.svg'
import IconChart from '@/shared/assets/chart-bold.svg'
import IconRising from '@/shared/assets/rising-bold.svg'
import IconSend from '@/shared/assets/send-bold.svg'
import IconArticle from '@/shared/assets/article-bold.svg'
import IconQuestion from '@/shared/assets/question-bold.svg'
import IconKakao from '@/shared/assets/kakaotalk.svg'
import IconLock from '@/shared/assets/lock-filled-bold.svg'
import type {
  IconName,
  SidebarIconProps,
} from '@/features/navigation/model/types'

const iconMap: Record<
  IconName,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  sidebar: IconSidebar,
  dashboard: IconDashboard,
  video: IconVideo,
  search: IconSearch,
  chart: IconChart,
  resing: IconRising,
  article: IconArticle,
  message: IconSend,
  question: IconQuestion,
  kakao: IconKakao,
  lock: IconLock,
}

export const SidebarIcon = ({
  name,
  className,
  size = 18,
}: SidebarIconProps) => {
  const IconComponent = iconMap[name]

  if (!IconComponent) return null

  return (
    <IconComponent
      className={className}
      style={{
        width: `${Number(size) / 10}rem`,
        height: `${Number(size) / 10}rem`,
        flexShrink: 0,
        display: 'block',
      }}
    />
  )
}
