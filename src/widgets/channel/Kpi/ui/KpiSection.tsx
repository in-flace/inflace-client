import { KpiCard } from '@/entities/channel/kpiCard'
import IconEye from '@/shared/assets/eye-bold.svg'
import IconParticipation from '@/shared/assets/participation-bold.svg'
import IconClock from '@/shared/assets/clock-bold.svg'
import { formatComma } from '@/shared/lib/format'
import { useKpi } from '@/features/channel/kpi'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { QueryBoundary } from '@/shared/ui/query-boundary'

export function KpiSection({ channelId }: { channelId: string }) {
  return (
    <QueryBoundary fallback={<KpiSkeleton />}>
      <KpiContent channelId={channelId} />
    </QueryBoundary>
  )
}

function KpiSkeleton() {
  return (
    //스켈레톤 UI, 로딩중일 때 상태를 표시합니다.
    <section className='flex h-fit w-full gap-24'>
      <Skeleton className='h-35 flex-1' />
      <Skeleton className='h-35 flex-1' />
      <Skeleton className='h-35 flex-1' />
      <Skeleton className='h-35 flex-1' />
    </section>
  )
}

function KpiContent({ channelId }: { channelId: string }) {
  const { data } = useKpi(channelId)

  return (
    <div className='flex flex-col gap-24 md:flex-row'>
      {/* 총 조회수 */}
      <KpiCard
        icon={<IconEye className='size-24 text-btn-primary-text-disabled' />}
        label='총 조회수'
        value={formatComma(data.totalViews)}
        unit='회'
      />

      {/* 평균 참여율 */}
      <KpiCard
        icon={
          <IconParticipation className='size-20 text-btn-primary-text-disabled' />
        }
        label='평균 참여율'
        value={data.avgEngagementRate.toFixed(0)}
        unit='%'
      />

      {/* 시청 유지율 */}
      <KpiCard
        icon={<IconEye className='size-20 text-btn-primary-text-disabled' />}
        label='시청 유지율'
        value={data.avgRetentionRate.toFixed(0)}
        unit='%'
      />

      {/* 업로드 주기 */}
      <KpiCard
        icon={<IconClock className='size-20 text-btn-primary-text-disabled' />}
        prefix='주 '
        label='업로드 주기'
        value={data.weeklyUploadCount}
        unit='회'
      />
    </div>
  )
}
