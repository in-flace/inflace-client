'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { TabGroup } from '@/shared/ui'
import { ChannelSummarySection } from '@/widgets/influencerDetail/channelSummary'
import { EngagementAnalyticsSection } from '@/widgets/influencerDetail/engagementAnalytics'
import { ImpactMetricsSection } from '@/widgets/influencerDetail/impactMetrics'
import { InfluencerBaseInfo } from '@/widgets/influencerDetail/influencerBaseInfo'
import { AdvertisementFilter } from '@/widgets/influencerDetail/advertisementFilter'
import { AdvertisementMetricsSection } from '@/widgets/influencerDetail/advertisementMetrics'
import { AdvertisementList } from '@/features/influencerDetail/advertisementList'
import {
  AdvertisementFilterQueryParams,
  useInfluencerBrandAnalysis,
} from '@/features/influencerDetail'

export const TAB = {
  PERFORMANCE: 'performance',
  ADVERTISEMENT: 'advertisement',
} as const

const TABS = [
  { id: TAB.PERFORMANCE, label: '성과' },
  { id: TAB.ADVERTISEMENT, label: '광고' },
] as const

export type Tab = (typeof TAB)[keyof typeof TAB]

/* 인플루언서 디테일 기본화면 */
export function InfluencerDetailPage() {
  const [activeTab, setActiveTab] = useState<Tab>(TAB.PERFORMANCE)

  const params = useParams<{ channelId: string }>()
  const channelId = params?.channelId

  const [filter, setFilter] = useState<AdvertisementFilterQueryParams>({
    videoFormat: 'ALL',
  })
  const [hasSearched, setHasSearched] = useState(false)

  // 광고 필터 검색 버튼 클릭 시 필터 값
  const [committedFilter, setCommittedFilter] =
    useState<AdvertisementFilterQueryParams | null>(null)

  const { data: brandAnalysisData, isLoading: isBrandAnalysisLoading } =
    useInfluencerBrandAnalysis(channelId ?? '', committedFilter)

  if (!channelId) return null

  return (
    <div className='flex w-full flex-col gap-24 bg-background-gray-default p-24 pb-96'>
      {/* 인플루언서 채널 정보 영역 */}
      <InfluencerBaseInfo channelId={channelId} />
      {/* 성과 / 광고 탭 영역 */}
      <TabGroup tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 성과 탭 선택 시 */}
      {activeTab === TAB.PERFORMANCE && (
        <>
          {/* 채널 요약 영역 */}
          <ChannelSummarySection channelId={channelId} />
          {/* 임팩트 지표 영역 */}
          <ImpactMetricsSection channelId={channelId} />
          {/* 롱폼 vs 숏폼 참여율 분석 영역 */}
          <EngagementAnalyticsSection channelId={channelId} />
        </>
      )}

      {/* 광고 탭 선택 시 */}
      {activeTab === TAB.ADVERTISEMENT && (
        <>
          {/* 광고 검색 영역 */}
          <AdvertisementFilter
            filter={filter}
            onFilterChange={setFilter}
            hasSearched={hasSearched}
            onSearch={(f) => {
              setHasSearched(true)
              setCommittedFilter(f)
            }}
          />
          {/* 검색 후 노출 영역 */}
          {committedFilter !== null && (
            <>
              {/* 광고 지표 분석 영역 */}
              <AdvertisementMetricsSection
                data={brandAnalysisData}
                isLoading={isBrandAnalysisLoading}
              />
              {/* 검색 결과 영역 */}
              <AdvertisementList
                channelId={channelId}
                filter={committedFilter}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
