import Link from 'next/link'

import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { VideoCard } from '@/entities/main/videoCard'
import { BlurPlanGate, PlanGate } from '@/features/planGate'
import {
  useTrendingVideos,
  mockTrendingVideos,
} from '@/features/main/trendingVideos'

//인기 급상승 동영상의 리스트를 보여줌
// channelId가 없으면(채널 미연동) API 호출 없이 mock 데이터로 미리보기를 보여줌
export function TrendingVideosSection({ channelId }: { channelId?: string }) {
  const { data, isLoading } = useTrendingVideos(channelId ?? '')
  const videos = data?.length ? data : mockTrendingVideos

  return (
    <section className='flex h-fit w-full flex-col gap-16'>
      {/* 급상승 동영상 헤더 */}
      <div className='flex h-fit w-full flex-col items-start justify-between gap-3'>
        <h3 className='text-ibm-title-lg-normal text-text-and-icon-default'>
          시청자 반응 급상승 동영상
        </h3>

        {/* 서브텍스트 + 더보기 */}
        <div className='flex h-fit w-full justify-between'>
          <p className='text-noto-title-sm-thin text-text-and-icon-tertiary'>
            조회수 대비 참여율이 채널 평균보다 높은 영상이에요
          </p>
          <Link
            href='/channel'
            className='size-fit gap-10 pt-1 pr-2 pb-3 pl-2 text-noto-label-sm-bold text-brand-primary'>
            더보기
          </Link>
        </div>
      </div>

      {/* 급상승 동영상 리스트 */}
      {isLoading ? (
        <div className='grid grid-cols-2 gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-64' />
          ))}
        </div>
      ) : !channelId ? (
        // 채널 미연동: mock 데이터 전체를 블러 미리보기로 노출
        <BlurPlanGate forceLocked>
          <div className='grid grid-cols-2 gap-4'>
            {videos.slice(0, 4).map((video) => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
        </BlurPlanGate>
      ) : (
        // 채널 연동: FREE 플랜은 앞 2개만 노출, 뒤 2개는 그룹으로 묶어 잠금
        <div className='grid grid-cols-2 gap-4'>
          {videos.slice(0, 2).map((video) => (
            <VideoCard key={video.id} {...video} />
          ))}
          <div className='col-span-2'>
            <PlanGate>
              <div className='grid grid-cols-2 gap-4'>
                {videos.slice(2, 4).map((video) => (
                  <VideoCard key={video.id} {...video} />
                ))}
              </div>
            </PlanGate>
          </div>
        </div>
      )}
    </section>
  )
}
