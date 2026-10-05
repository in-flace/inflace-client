'use client'

import axios from 'axios'
import {
  IMPACT_ITEM,
  ImpactMetricsCard,
  ImpactMetricsList,
  getImpactTier,
} from '@/entities/influencerDetail/impactMetrics'
import { FrequencyTrend } from '@/entities/influencerDetail'
import { useInfluencerDetailQuery } from '@/features/influencerDetail'
import { getViewCvLabel } from '@/shared/lib/format'
import { Tooltip } from '@/shared/ui/tooltip'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import IconChart from '@/shared/assets/chart-bold.svg'
import IconQuestion from '@/shared/assets/question-bold.svg'

const frequencyTrendValue: Record<FrequencyTrend, string> = {
  INCREASING: '증가중',
  DECREASING: '감소중',
  STABLE: '유지중',
}

export function ImpactMetricsSection({ channelId }: { channelId: string }) {
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
      <div className='flex flex-col gap-32 rounded-12 bg-white p-24 pb-32'>
        {/* 아이콘 + 타이틀 */}
        <div className='flex h-fit w-fit items-center gap-12'>
          <span className='rounded-12 bg-primitive-brand-vivid-75 p-4'>
            <IconChart className='size-24 text-btn-primary-text-disabled' />
          </span>
          <div className='flex items-center text-ibm-title-md-normal text-text-and-icon-default'>
            채널 핵심 지표
            <Tooltip
              showArrow={false}
              side='right'
              align='start'
              content={<ImpactMetricsList />}
              className='p-24'>
              <button type='button' aria-label='채널 핵심 지표 안내 보기'>
                <IconQuestion className='size-20 text-text-and-icon-disabled' />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* 채널 핵심 지표 카드 */}
        <div className='flex h-fit w-full gap-32'>
          <Skeleton className='h-[27.3rem] flex-1' />
          <Skeleton className='h-[27.3rem] flex-1' />
          <Skeleton className='h-[27.3rem] flex-1' />
          <Skeleton className='h-[27.3rem] flex-1' />
        </div>
      </div>
    )
  }

  // CHANNEL_INSIGHT_400 (채널 영상이 50개 이하인 경우)
  if (insightErrorCode) {
    return (
      <div className='flex flex-col gap-32 rounded-12 bg-white p-24 pb-32'>
        {/* 아이콘 + 타이틀 */}
        <div className='flex h-fit w-fit items-center gap-12'>
          <span className='rounded-12 bg-primitive-brand-vivid-75 p-4'>
            <IconChart className='size-24 text-btn-primary-text-disabled' />
          </span>
          <div className='flex items-center text-ibm-title-md-normal text-text-and-icon-default'>
            채널 핵심 지표
            <Tooltip
              showArrow={false}
              side='right'
              align='start'
              content={<ImpactMetricsList />}
              className='p-24'>
              <button type='button' aria-label='채널 핵심 지표 안내 보기'>
                <IconQuestion className='size-20 text-text-and-icon-disabled' />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* 에러 텍스트 */}
        <div className='flex h-[27.3rem] w-full items-center justify-center'>
          <p className='text-noto-body-lg-normal text-text-and-icon-secondary'>
            분석 가능한 공개 영상이 부족합니다
          </p>
        </div>
      </div>
    )
  }

  if (!apiData) return null
  const { audience, content, activity, advertisement } = apiData

  return (
    <div className='flex flex-col gap-32 rounded-12 bg-white p-24 pb-32'>
      {/* 아이콘 + 타이틀 */}
      <div className='flex h-fit w-fit items-center gap-12'>
        <span className='rounded-12 bg-primitive-brand-vivid-75 p-4'>
          <IconChart className='size-24 text-btn-primary-text-disabled' />
        </span>
        <div className='flex items-center text-ibm-title-md-normal text-text-and-icon-default'>
          채널 핵심 지표
          <Tooltip
            showArrow={false}
            side='right'
            align='start'
            content={<ImpactMetricsList />}
            className='p-24'>
            <button type='button' aria-label='채널 핵심 지표 안내 보기'>
              <IconQuestion className='size-20 text-text-and-icon-disabled' />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 임팩트 지표 카드 */}
      <div className='flex h-fit w-full gap-32'>
        {/* 팬 반응 */}
        <ImpactMetricsCard
          title='팬 반응'
          badge={IMPACT_ITEM[getImpactTier(audience.score)].badge}
          mainMetric={{
            value: audience.score.toFixed(0),
            unit: '점',
          }}
          subMetrics={[
            {
              label: '평균 좋아요 비율',
              value: audience.likeRate.toFixed(1),
              unit: '%',
            },
            {
              label: '평균 댓글 비율',
              value: audience.commentRate.toFixed(1),
              unit: '%',
            },
            {
              label: '평균 참여율',
              value: audience.engagementRate.toFixed(1),
              unit: '%',
            },
            {
              label: '구독자 대비 조회율',
              value: audience.viewsPerSubscriberRate.toFixed(1),
              unit: '%',
              tooltip: '구독자 수에 비해 영상이 얼마나 조회되는지 보여줍니다.',
              side: 'right',
            },
          ]}
          tier={getImpactTier(audience.score)}
        />

        {/* 콘텐츠 확산력 */}
        <ImpactMetricsCard
          title='콘텐츠 확산력'
          badge={IMPACT_ITEM[getImpactTier(content.score)].badge}
          mainMetric={{
            value: content.score.toFixed(0),
            unit: '점',
          }}
          subMetrics={[
            {
              label: '조회수 2배 영상',
              value: content.viral2xRate.toFixed(1),
              unit: '%',
            },
            {
              label: '조회수 5배 영상',
              value: content.viral5xRate.toFixed(1),
              unit: '%',
            },
            {
              label: '조회수 성장률',
              value: content.growthTrendRate.toFixed(1),
              unit: '%',
              tooltip:
                '최근 영상의 평균 조회수가 이전 영상보다 얼마나 증가했는지 보여줍니다.',
              side: 'left',
            },
            {
              label: 'VPH 중앙값',
              value: content.medianVph.toFixed(0),
              unit: '회/시간',
              tooltip:
                '최근 영상들이 1시간에 평균 몇 회 조회되고 있는지를 나타내는 지표입니다',
              side: 'left',
            },
          ]}
          tier={getImpactTier(content.score)}
        />

        {/* 업로드 활동성 */}
        <ImpactMetricsCard
          title='업로드 활동성'
          badge={IMPACT_ITEM[getImpactTier(activity.score)].badge}
          mainMetric={{
            value: activity.recentUpload,
            unit: '일 전',
          }}
          subMetrics={[
            {
              label: '업로드 주기',
              prefix: '주 ',
              value: activity.uploadCycle.toFixed(1),
              unit: '회',
            },
            {
              label: '빈도 변화',
              value: frequencyTrendValue[activity.frequencyTrend],
            },
          ]}
          tier={getImpactTier(activity.score)}
        />

        {/* 광고 적합도 */}
        {advertisement ? (
          <ImpactMetricsCard
            title='광고 적합도'
            badge={IMPACT_ITEM[getImpactTier(advertisement.score)].badge}
            mainMetric={{
              value: advertisement.score.toFixed(0),
              unit: '점',
            }}
            subMetrics={[
              {
                label: '협찬 영상 비율',
                value: advertisement.subscriberHealthRate.toFixed(1),
                unit: '% ',
              },
              {
                label: '조회수 변동성',
                value: getViewCvLabel(advertisement.viewCoefficientOfVariation),
                tooltip: `영상별 조회수 차이가 얼마나 큰지 보여줍니다. \n차이가 작을수록 조회수가 안정적인 채널입니다.`,
                side: 'left',
              },
            ]}
            tier={getImpactTier(advertisement.score)}
          />
        ) : (
          <ImpactMetricsCard empty />
        )}
      </div>
    </div>
  )
}
