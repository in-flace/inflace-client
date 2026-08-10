'use client'

import { useState } from 'react'
import { ContentType, TabGroup } from '@/shared/ui'
import { InfiniteScrollList } from '@/shared/ui/infinite-scroll-list'
import { AdvertisementCard } from './AdvertisementCard'
import { useInfluencerBrand } from '../model/useInfluencerBrand'
import type {
  AdvertisementListParams,
  VideoFormat,
  SortCriteria,
} from '../model/types'

const AD_FILTER_TABS = [
  { id: 'ALL', label: '전체' },
  { id: 'LONG_FORM', label: '롱폼' },
  { id: 'SHORT_FORM', label: '숏폼' },
] as const

const SORT_OPTIONS = [
  { label: '최신순', filter: 'LATEST' },
  { label: '조회수순', filter: 'VIEW_COUNT' },
  { label: '좋아요순', filter: 'LIKE_COUNT' },
] as const

type AdFilterTab = (typeof AD_FILTER_TABS)[number]['id']
type SortOption = (typeof SORT_OPTIONS)[number]['filter']

interface AdvertisementListProps {
  channelId: string
  filter: Pick<AdvertisementListParams, 'categoryId' | 'startDate' | 'endDate'>
}

export function AdvertisementList({
  channelId,
  filter,
}: AdvertisementListProps) {
  const [videoFormat, setVideoFormat] = useState<AdFilterTab>('ALL')
  const [sortCriteria, setSortCriteria] = useState<SortOption>('LATEST')

  const { data, sentinelRef, isFetchingNextPage, hasNextPage } =
    useInfluencerBrand(channelId, {
      ...filter,
      videoFormat: videoFormat as VideoFormat,
      sortCriteria: sortCriteria as SortCriteria,
      sortOrder: 'DESC',
    })

  const videos = data?.pages.flatMap((page) => page.content) ?? []

  return (
    <div className='flex h-fit w-full flex-col items-center p-24 pb-0'>
      {/* 컨텐츠 타입 탭 (전체/롱폼/숏폼) */}
      <TabGroup
        type='fit'
        tabs={AD_FILTER_TABS}
        activeTab={videoFormat}
        onTabChange={setVideoFormat}
      />
      <div className='flex h-fit w-full flex-col gap-16'>
        {/* 정렬 (최신순/조회수순/좋아요순) */}
        <ContentType
          className='w-full justify-end'
          options={SORT_OPTIONS}
          filter={sortCriteria}
          onFilterChange={(value) => setSortCriteria(value as SortOption)}
        />

        {/* 광고 영상 카드 리스트 */}
        <InfiniteScrollList
          sentinelRef={sentinelRef}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}>
          <div className='grid h-fit w-full grid-cols-3 gap-24'>
            {videos.map((video) => (
              <AdvertisementCard key={video.videoId} video={video} />
            ))}
          </div>
        </InfiniteScrollList>
      </div>
    </div>
  )
}
