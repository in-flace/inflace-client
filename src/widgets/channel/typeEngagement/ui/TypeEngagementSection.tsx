'use client'

import {
  TypeEngagementChart,
  TypeEngagementList,
} from '@/entities/channel/typeEngagement'
import { useTypeEngagement } from '@/features/channel/typeEngagement'
import IconParticipation from '@/shared/assets/participation-bold.svg'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { QueryBoundary } from '@/shared/ui/query-boundary'

export function TypeEngagementSection({ channelId }: { channelId: string }) {
  return (
    <QueryBoundary fallback={<TypeEngagementSkeleton />}>
      <TypeEngagementContent channelId={channelId} />
    </QueryBoundary>
  )
}

function TypeEngagementSkeleton() {
  return (
    <div className='flex flex-1 flex-col gap-32 rounded-16 bg-white p-24 shadow-[0_2px_6px_0_rgba(13,13,13,0.04)]'>
      <div className='flex h-fit w-full items-center justify-between'>
        <div className='flex h-fit w-fit items-center gap-8'>
          <span className='rounded-12 bg-primitive-brand-vivid-75 p-4'>
            <IconParticipation className='size-24 text-btn-primary-text-disabled' />
          </span>
          <span className='text-ibm-title-md-normal'>
            롱폼 / 숏폼 평균 참여율 차트 TOP5
          </span>
        </div>
      </div>
      <div className='flex h-fit w-full flex-col justify-center gap-32'>
        <Skeleton className='h-[77.6rem] w-full' />
      </div>
    </div>
  )
}

function TypeEngagementContent({ channelId }: { channelId: string }) {
  const { data } = useTypeEngagement(channelId)

  return (
    <div className='flex flex-1 flex-col gap-32 rounded-16 bg-white p-24 shadow-[0_2px_6px_0_rgba(13,13,13,0.04)]'>
      <div className='flex h-fit w-full items-center justify-between'>
        <div className='flex h-fit w-fit items-center gap-8'>
          <span className='rounded-12 bg-primitive-brand-vivid-75 p-4'>
            <IconParticipation className='size-24 text-btn-primary-text-disabled' />
          </span>
          <span className='text-ibm-title-md-normal'>
            롱폼 / 숏폼 평균 참여율 차트 TOP5
          </span>
        </div>
      </div>
      <div className='flex h-fit w-full flex-col justify-center gap-32'>
        {/* 롱폼 / 숏폼 평균 Pie Chart */}
        <TypeEngagementChart data={data.summary} />
        {/* 롱폼 / 숏폼 평균 Table */}
        <TypeEngagementList data={data.videos} />
      </div>
    </div>
  )
}
