'use client'

import { useState } from 'react'
import { TrendingVideo } from '@/entities/channel/trendingVideo'
import { ContentType } from '@/shared/ui'
import { useTrendingVideo } from '@/features/channel/trendingVideo'
import IconRising from '@/shared/assets/rising-bold.svg'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { QueryBoundary } from '@/shared/ui/query-boundary'

export function TrendingVideoSection({ channelId }: { channelId: string }) {
  const [isShort, setIsShort] = useState(false)

  return (
    <QueryBoundary fallback={<TrendingVideoSkeleton />}>
      <TrendingVideoContent
        channelId={channelId}
        isShort={isShort}
        onIsShortChange={setIsShort}
      />
    </QueryBoundary>
  )
}

function TrendingVideoSkeleton() {
  return (
    <div className='flex flex-col gap-24 rounded-16 bg-white p-24 shadow-[0_2px_6px_0_rgba(13,13,13,0.04)]'>
      <div className='flex h-fit w-full items-end justify-between'>
        <div className='flex h-fit w-fit items-start gap-8'>
          <span className='rounded-12 bg-primitive-brand-vivid-75 p-4'>
            <IconRising className='size-24 text-btn-primary-text-disabled' />
          </span>
          <div className='flex flex-col gap-4'>
            <span className='text-ibm-title-md-normal'>
              시청자 반응 급상승 영상
            </span>
            <span className='text-noto-body-xxs-normal text-text-and-icon-tertiary'>
              조회수 대비 참여율 (좋아요, 댓글)이 높은 영상이에요
            </span>
          </div>
        </div>
      </div>
      <div className='h-fit w-full'>
        <Skeleton className='h-[58.4rem] w-full' />
      </div>
    </div>
  )
}

function TrendingVideoContent({
  channelId,
  isShort,
  onIsShortChange,
}: {
  channelId: string
  isShort: boolean
  onIsShortChange: (isShort: boolean) => void
}) {
  const { data } = useTrendingVideo(channelId, isShort)

  return (
    <div className='flex flex-col gap-24 rounded-16 bg-white p-24 shadow-[0_2px_6px_0_rgba(13,13,13,0.04)]'>
      <div className='flex h-fit w-full items-end justify-between'>
        <div className='flex h-fit w-fit items-start gap-8'>
          <span className='rounded-12 bg-primitive-brand-vivid-75 p-4'>
            <IconRising className='size-24 text-btn-primary-text-disabled' />
          </span>
          <div className='flex flex-col gap-4'>
            <span className='text-ibm-title-md-normal'>
              시청자 반응 급상승 영상
            </span>
            <span className='text-noto-body-xxs-normal text-text-and-icon-tertiary'>
              조회수 대비 참여율 (좋아요, 댓글)이 높은 영상이에요
            </span>
          </div>
        </div>
        <ContentType
          options={[
            { label: '롱폼', filter: false },
            { label: '숏폼', filter: true },
          ]}
          filter={isShort}
          onFilterChange={onIsShortChange}
        />
      </div>
      <div className='h-fit w-full'>
        <TrendingVideo data={data} />
      </div>
    </div>
  )
}
