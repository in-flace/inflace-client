'use client'

import { useState } from 'react'
import { NewInflow } from '@/entities/channel/newInflow'
import { ContentType } from '@/shared/ui'
import { useNewInflow } from '@/features/channel/newInflow/model/useNewInflow'
import IconNewEye from '@/shared/assets/newEye-bold.svg'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { QueryBoundary } from '@/shared/ui/query-boundary'

export function NewInflowSection({ channelId }: { channelId: string }) {
  const [isShort, setIsShort] = useState(false)

  return (
    <QueryBoundary fallback={<NewInflowSkeleton />}>
      <NewInflowContent
        channelId={channelId}
        isShort={isShort}
        onIsShortChange={setIsShort}
      />
    </QueryBoundary>
  )
}

function NewInflowSkeleton() {
  return (
    <div className='flex flex-col gap-24 rounded-16 bg-white p-24 shadow-[0_2px_6px_0_rgba(13,13,13,0.04)]'>
      <div className='flex h-fit w-full items-center justify-between'>
        <div className='flex h-fit w-fit items-center gap-8'>
          <span className='rounded-12 bg-primitive-brand-vivid-75 p-4'>
            <IconNewEye className='size-24 text-btn-primary-text-disabled' />
          </span>
          <span className='text-ibm-title-md-normal'>신규 유입 비율 TOP 5</span>
        </div>
      </div>
      <div className='h-fit w-full'>
        <Skeleton className='h-[58.4rem] w-full' />
      </div>
    </div>
  )
}

function NewInflowContent({
  channelId,
  isShort,
  onIsShortChange,
}: {
  channelId: string
  isShort: boolean
  onIsShortChange: (isShort: boolean) => void
}) {
  const { data } = useNewInflow(channelId, isShort)

  return (
    <div className='flex flex-col gap-24 rounded-16 bg-white p-24 shadow-[0_2px_6px_0_rgba(13,13,13,0.04)]'>
      <div className='flex h-fit w-full items-center justify-between'>
        <div className='flex h-fit w-fit items-center gap-8'>
          <span className='rounded-12 bg-primitive-brand-vivid-75 p-4'>
            <IconNewEye className='size-24 text-btn-primary-text-disabled' />
          </span>
          <span className='text-ibm-title-md-normal'>신규 유입 비율 TOP 5</span>
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
        <NewInflow data={data} />
      </div>
    </div>
  )
}
