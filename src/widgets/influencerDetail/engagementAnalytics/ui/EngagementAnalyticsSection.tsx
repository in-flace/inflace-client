'use client'

import axios from 'axios'
import {
  ContentChart,
  FormatBarChart,
} from '@/entities/influencerDetail/engagementAnalytics'
import { format10Thousands } from '@/shared/lib/format'
import { useInfluencerDetailQuery } from '@/features/influencerDetail'
import IconParticipation from '@/shared/assets/participation-bold.svg'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'

export function EngagementAnalyticsSection({
  channelId,
}: {
  channelId: string
}) {
  const {
    data: apiData,
    isFetching,
    isError,
    error,
  } = useInfluencerDetailQuery(channelId)

  // 에러 코드 CHANNEL_INSIGHT_400 분기처리
  const insightErrorCode =
    isError &&
    axios.isAxiosError(error) &&
    error.response?.data?.error?.code === 'CHANNEL_INSIGHT_400'

  if (isFetching || (isError && !insightErrorCode)) {
    return (
      <div className='flex flex-col gap-32 rounded-12 bg-white p-24 pb-32 shadow-[0_2px_6px_0_rgba(13,13,13,0.04)]'>
        {/* 아이콘 + 타이틀 */}
        <div className='flex h-fit w-fit items-center gap-12'>
          <span className='rounded-12 bg-primitive-brand-vivid-75 p-4'>
            <IconParticipation className='size-24 text-btn-primary-text-disabled' />
          </span>
          <span className='text-ibm-title-md-normal text-text-and-icon-default'>
            롱폼 vs 숏폼 참여율 분석
          </span>
        </div>
        <div className='flex gap-[12rem] px-32'>
          <Skeleton className='h-[24.8rem] w-[29.9rem]' />
          <div className='flex flex-1 flex-col gap-40'>
            <Skeleton className='h-[10.4rem]' />
            <Skeleton className='h-[10.4rem]' />
          </div>
        </div>
      </div>
    )
  }

  if (insightErrorCode) {
    return (
      <div className='flex flex-col gap-32 rounded-12 bg-white p-24 pb-32 shadow-[0_2px_6px_0_rgba(13,13,13,0.04)]'>
        {/* 아이콘 + 타이틀 */}
        <div className='flex h-fit w-fit items-center gap-12'>
          <span className='rounded-12 bg-primitive-brand-vivid-75 p-4'>
            <IconParticipation className='size-24 text-btn-primary-text-disabled' />
          </span>
          <span className='text-ibm-title-md-normal text-text-and-icon-default'>
            롱폼 vs 숏폼 참여율 분석
          </span>
        </div>
        <div className='flex h-[27.3rem] w-full items-center justify-center'>
          <p className='text-noto-body-lg-normal text-text-and-icon-secondary'>
            분석 가능한 공개 영상이 부족합니다
          </p>
        </div>
      </div>
    )
  }

  if (!apiData) return null
  const data = apiData

  return (
    <div className='flex flex-col gap-32 rounded-12 bg-white p-24 pb-32 shadow-[0_2px_6px_0_rgba(13,13,13,0.04)]'>
      {/* 아이콘 + 타이틀 */}
      <div className='flex h-fit w-fit items-center gap-12'>
        <span className='rounded-12 bg-primitive-brand-vivid-75 p-4'>
          <IconParticipation className='size-24 text-btn-primary-text-disabled' />
        </span>
        <span className='text-ibm-title-md-normal text-text-and-icon-default'>
          롱폼 vs 숏폼 참여율 분석
        </span>
      </div>
      <div className='flex gap-[20rem] px-32'>
        {/* 콘텐츠 비중 차트 */}
        <ContentChart data={data.formatAnalysis} />
        <div className='flex flex-1 flex-col gap-40'>
          {/* 평균 조회수 차트 */}
          <FormatBarChart
            title='평균 조회수'
            subtitle='최근 30일'
            data={data.formatAnalysis}
            dataKey='averageViews30d'
            formatValue={format10Thousands}
          />
          {/* 평균 참여율 차트 */}
          <FormatBarChart
            title='참여율'
            data={data.formatAnalysis}
            dataKey='engagementRate'
            formatValue={(v) => `${v.toFixed(1)}%`}
            domain={[0, 100]}
          />
        </div>
      </div>
    </div>
  )
}
