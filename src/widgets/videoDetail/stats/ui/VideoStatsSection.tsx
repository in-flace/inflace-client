'use client'

import { VideoStatsCard } from './VideoStatsCard'
import { useVideoStats } from '@/features/videoDetail/stats'
import { formatDate } from '@/shared/lib/format'
import type { VideoStatsDto } from '@/entities/video'

import EyeIcon from '@/shared/assets/eye-bold.svg'
import LikeIcon from '@/shared/assets/like-bold.svg'
import CommentIcon from '@/shared/assets/comment-bold.svg'
import ShareIcon from '@/shared/assets/share-bold.svg'
import ClickIcon from '@/shared/assets/click-bold.svg'
import UsersIcon from '@/shared/assets/users-bold.svg'
import SubscribeIcon from '@/shared/assets/subscribe-bold.svg'
import ParticipationIcon from '@/shared/assets/participation-bold.svg'
import VphIcon from '@/shared/assets/vph-bold.svg'
import OutlierIcon from '@/shared/assets/outlier-bold.svg'

const ICON_CLASS = 'size-30 text-btn-primary-text-disabled '

function buildGroups(data?: VideoStatsDto) {
  const collected = data ? formatDate(data.collectedAt) : null
  const collectedLabel = collected
    ? `${collected.year}년 ${Number(collected.month)}월 ${Number(collected.day)}일 기준`
    : undefined

  return [
    {
      title: '기본 지표',
      cards: [
        {
          icon: <EyeIcon className={ICON_CLASS} />,
          label: '총 조회수',
          description: collectedLabel,
          metric: data?.viewCount,
          valueFormat: 'korean' as const,
        },
        {
          icon: <LikeIcon className={ICON_CLASS} />,
          label: '좋아요 수',
          metric: data?.likeCount,
          valueFormat: 'korean' as const,
        },
        {
          icon: <CommentIcon className={ICON_CLASS} />,
          label: '댓글 수',
          metric: data?.commentCount,
          valueFormat: 'korean' as const,
        },
        {
          icon: <ShareIcon className={ICON_CLASS} />,
          label: '공유 수',
          metric: data?.shareCount,
          valueFormat: 'korean' as const,
        },
      ],
    },
    {
      title: '유입 지표',
      cards: [
        {
          icon: <ClickIcon className={ICON_CLASS} />,
          label: 'CTR',
          description: '썸네일 클릭률',
          hasTooltip: true,
          tooltipLabel: '클릭 수 / 노출 수 *100',
          metric: data?.ctr,
          valueFormat: 'percent' as const,
        },
        {
          icon: <UsersIcon className={ICON_CLASS} />,
          label: '신규 유입 비율',
          description: '구독자가 아닌 신규 시청자 비율',
          hasTooltip: true,
          tooltipLabel: '비구독자(신규 유입)가 본 조회수/총조회수',
          metric: data?.newViewerRate,
          valueFormat: 'percent' as const,
        },
        {
          icon: <SubscribeIcon className={ICON_CLASS} />,
          label: '구독 전환 수',
          description: '영상 시청 후 구독으로 이어진 수',
          hasTooltip: false,
          metric: data?.subscribersGained,
          valueFormat: 'korean' as const,
        },
      ],
    },
    {
      title: '참여 지표',
      cards: [
        {
          icon: <ParticipationIcon className={ICON_CLASS} />,
          label: '영상 참여율',
          description: '개별 영상 참여율',
          hasTooltip: true,
          tooltipLabel: '좋아요+댓글 / 조회수',
          metric: data?.engagementRate,
          valueFormat: 'percent' as const,
        },
      ],
    },
    {
      title: '성장 지표',
      cards: [
        {
          icon: <VphIcon className={ICON_CLASS} />,
          label: 'VPH',
          description: '시간 당 조회수',
          hasTooltip: true,
          tooltipLabel: '총 조회수 / 업로드 후 경과 시간',
          metric: data?.vph,
          valueFormat: 'float' as const,
        },
        {
          icon: <OutlierIcon className={ICON_CLASS} />,
          label: 'Outlier',
          description: '채널 평균 조회수 대비 상승배수',
          hasTooltip: true,
          tooltipLabel: '증가한 조회수 / 채널 평균 조회수',
          metric: data?.outlier,
          valueFormat: 'float' as const,
        },
      ],
    },
  ]
}

interface VideoStatsSectionProps {
  videoId: string
}

export function VideoStatsSection({ videoId }: VideoStatsSectionProps) {
  const { data: stats, isLoading } = useVideoStats(videoId)

  if (isLoading) return null

  const groups = buildGroups(stats)

  return (
    <section className='flex flex-col gap-32'>
      {groups.map((group) => (
        <div key={group.title} className='flex flex-col gap-16'>
          <div className='flex w-full items-center justify-center px-[0.2rem]'>
            <p className='min-w-px flex-1 text-ibm-title-md-normal text-text-and-icon-default'>
              {group.title}
            </p>
          </div>
          {/* 카드 폭 554px 고정(시안). 열 수는 화면 폭에 맞춰 늘고 줄며,
           * 554px보다 좁은 화면에서는 1열로 화면 폭만큼 줄어든다.
           * @container: 뷰포트가 아니라 이 영역의 실제 폭(사이드바 접힘 여부 반영)으로 카드의 모바일 배치를 고른다 */}
          <div className='@container grid grid-cols-[repeat(auto-fill,minmax(min(55.4rem,100%),55.4rem))] gap-16'>
            {group.cards.map((card) => (
              <VideoStatsCard key={card.label} {...card} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
