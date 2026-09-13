'use client'

import { useAuth } from '@/features/auth'
import { ChannelProfileSection } from '@/widgets/main/channelProfile'
import { KpiSection } from '@/widgets/channel/Kpi'
import { SubscriberGrowthSection } from '@/widgets/channel/SubscriberGrowth'
import { TrendingVideoSection } from '@/widgets/channel/trendingVideo'
import { NewInflowSection } from '@/widgets/channel/newInflow'
import { TypeEngagementSection } from '@/widgets/channel/typeEngagement'
import { SubscriberDemographicsSection } from '@/widgets/channel/subscriberDemographics'

export function ChannelPage() {
  const { user } = useAuth()
  const id = user?.userChannelDetails?.channelId?.toString() ?? ''

  /* 아래 위젯들은 useSuspenseQuery를 쓰므로 channelId가 확정되기 전엔
   * 아예 마운트하지 않는다. ChannelLinkedLayout이 이 구간을 invisible로
   * 가려주므로 시각적으로 달라지는 건 없다. */
  if (!id) return null

  return (
    <div className='flex flex-col gap-24 bg-background-gray-default pb-96'>
      {/* 프로필 카드 */}
      <ChannelProfileSection
        channelId={id}
        isExpanded={true}
        variant='dashboard'
      />

      <div className='flex flex-col gap-24 px-24'>
        {/* 핵심 지표 카드 */}
        <KpiSection channelId={id} />

        {/* 구독자 추이 그래프 */}
        <SubscriberGrowthSection channelId={id} />

        {/* 영상 성과 테이블 */}
        <TrendingVideoSection channelId={id} />

        {/* 신규 유입 비율 TOP5 */}
        <NewInflowSection channelId={id} />

        <div className='flex items-start gap-24'>
          {/* 롱폼/숏폼 평균 참여율 TOP5 */}
          <TypeEngagementSection channelId={id} />
          <SubscriberDemographicsSection channelId={id} />
        </div>
      </div>
    </div>
  )
}
