'use client'

import dynamic from 'next/dynamic'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  InfluencerList,
  useInfluencers,
  SERVER_FILTER_DEFAULTS,
  SORT_OPTIONS,
} from '@/features/influencer'
import { useYoutubeCategories } from '@/entities/youtubeCategory'
import type { SortCriteria, SortOrder } from '@/entities/influencer'
import { InfluencerFilter } from '@/widgets/influencer'

const InfluencerListSectionDynamic = dynamic(
  () => Promise.resolve(InfluencerListSection),
  { ssr: false }
)

export function InfluencerPage() {
  const { data: categoriesData } = useYoutubeCategories()
  const categories = categoriesData?.youtubeCategories ?? []

  return (
    <div className='flex h-fit w-full flex-col gap-24 pb-[9.6rem]'>
      <InfluencerFilter categories={categories} />
      <div className='h-full'>
        <InfluencerListSectionDynamic />
      </div>
    </div>
  )
}

function InfluencerListSection() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filters = {
    channelName: searchParams?.get('channelName') ?? undefined,
    categoryIds: searchParams?.getAll('categoryIds').map(Number) ?? undefined,
    useDefaultCategories: SERVER_FILTER_DEFAULTS.useDefaultCategories,
    subscriberFrom: searchParams?.get('subscriberFrom') ?? undefined,
    subscriberTo: searchParams?.get('subscriberTo') ?? undefined,
    uploadPeriod: searchParams?.get('uploadPeriod') ?? undefined,
    hasAdHistory:
      searchParams?.get('hasAdHistory') ?? SERVER_FILTER_DEFAULTS.hasAdHistory,
    /* 서버 기본값을 그대로 실어 보낸다. 보내지 않아도 서버가 같은 값을 적용하지만,
     * 화면에 보이는 필터와 실제 요청이 어긋나면 나중에 추적이 어렵다. */
    engagementRateFrom:
      searchParams?.get('engagementRateFrom') ??
      SERVER_FILTER_DEFAULTS.engagementRateFrom,
    engagementRateTo:
      searchParams?.get('engagementRateTo') ??
      SERVER_FILTER_DEFAULTS.engagementRateTo,
    outlierRange: searchParams?.get('outlierRange') ?? undefined,
    sortCriteria: (searchParams?.get('sortCriteria') ?? undefined) as
      SortCriteria | undefined,
    sortOrder: (searchParams?.get('sortOrder') ?? undefined) as
      SortOrder | undefined,
  }

  const { data, isLoading, sentinelRef, isFetchingNextPage, hasNextPage } =
    useInfluencers(filters)

  const influencers = data?.pages.flatMap((page) => page.content) ?? []

  const sortCriteriaParam = filters.sortCriteria
  const sortOrderParam = filters.sortOrder
  const selectedIndex = SORT_OPTIONS.findIndex(
    (o) =>
      o.sortCriteria === sortCriteriaParam && o.sortOrder === sortOrderParam
  )

  const handleSortChange = (
    sortCriteria: SortCriteria,
    sortOrder: SortOrder
  ) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set('sortCriteria', sortCriteria)
    params.set('sortOrder', sortOrder)
    router.replace(`${pathname}?${params.toString()}`)
  }

  if (isLoading) {
    return (
      <div className='text-noto-label-sm-medium px-24 text-text-and-icon-tertiary'>
        불러오는 중...
      </div>
    )
  }

  return (
    <InfluencerList
      selectedIndex={selectedIndex}
      onSortChange={handleSortChange}
      influencers={influencers}
      sentinelRef={sentinelRef}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={!!hasNextPage}
    />
  )
}
