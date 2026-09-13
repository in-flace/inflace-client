'use client'

import {
  ChannelProfileSection,
  ChannelProfileEmptyState,
} from '@/widgets/main/channelProfile'
import { TrendingVideosSection } from '@/widgets/main/trendingVideos'
import { TestTrendMagazineSection } from '@/widgets/main/testTrendMagazine'
import { useAuth } from '@/features/auth'
import { useYoutubeConnectModal } from '@/features/channelConnect'

export function ChannelProfilePage() {
  const { user } = useAuth()
  const channelId = user?.userChannelDetails?.channelId?.toString()
  const openYoutubeConnectModal = useYoutubeConnectModal((s) => s.open)

  if (!channelId) {
    return (
      <div className='flex flex-col'>
        {/* 채널 미연동 안내 */}
        <ChannelProfileEmptyState onConnect={openYoutubeConnectModal} />

        {/* 콘텐츠: channelId 없이도 mock 데이터로 dim/lock 미리보기를 보여줌 */}
        <div className='flex h-fit w-full flex-col px-24 pt-40 pb-96'>
          <TrendingVideosSection />
          <TestTrendMagazineSection />
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col'>
      {/* 프로필 카드 */}
      <ChannelProfileSection channelId={channelId} isExpanded={false} />

      {/* 콘텐츠 */}
      <div className='flex h-fit w-full flex-col px-24 pt-40 pb-96'>
        <TrendingVideosSection channelId={channelId} />
        <TestTrendMagazineSection />
      </div>
    </div>
  )
}
