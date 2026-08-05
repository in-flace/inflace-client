import Image from 'next/image'

import {
  formatMonthAgo,
  format10Thousands,
  formatThousands,
} from '@/shared/lib/format'
import type { VideoCardItem } from '../model/types'

/* assets */
import ClickBold from '@/shared/assets/click-thin.svg'
import Participation from '@/shared/assets/participation-thin.svg'
import Eye from '@/shared/assets/eye-thin.svg'
import Like from '@/shared/assets/like-thin.svg'
import Comment from '@/shared/assets/comment-thin.svg'
import Clock from '@/shared/assets/clock-thin.svg'

export function VideoCard({
  thumbnailUrl,
  title,
  duration,
  viewCount,
  likeCount,
  commentCount,
  publishedAt,
  engagementRate,
  ctr,
}: VideoCardItem) {
  return (
    <div className='flex h-fit w-full min-w-[51.2rem] gap-20 rounded-8 border border-stroke-border-gray-default bg-background-gray-default p-20'>
      <div className='relative min-h-[11.6rem] min-w-[20.8rem]'>
        {/* 썸네일 */}
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          sizes='208px'
          className='rounded-6 object-cover'
        />
        {/* 영상 길이 */}
        {duration && (
          <span className='absolute right-6 bottom-6 gap-10 rounded-4 bg-black/80 px-4 py-2 text-xs text-label-xs font-medium text-white'>
            {duration}
          </span>
        )}
      </div>

      {/* 우측 내용 */}
      <div className='flex h-fit flex-1 flex-col justify-between gap-16'>
        {/* 우측 상단 정보 */}
        <div className='flex h-fit w-full flex-col gap-4'>
          {/* 참여율 / CTR */}
          <div className='flex size-fit gap-4'>
            <span className='flex size-fit items-center justify-center rounded-4 bg-brand-primary px-6 py-4 text-noto-label-md-normal text-white'>
              <Participation className='h-20 w-20' />
              참여율 {engagementRate.toFixed(1)}%
            </span>

            <span className='flex size-fit items-center justify-center rounded-4 bg-brand-secondary px-6 py-4 text-noto-label-md-normal text-white'>
              <ClickBold className='h-20 w-20' />
              CTR {ctr.toFixed(1)}%
            </span>
          </div>
          {/* 영상 제목 */}
          <p className='line-clamp-2 text-noto-title-sm-normal text-text-and-icon-default'>
            {title}
          </p>
        </div>

        {/* 우측 하단 정보: 조회수, 좋아요, 댓글, 업로드일 */}
        <div className='flex size-fit py-2 text-noto-caption-md-normal text-text-and-icon-secondary'>
          <span className='flex size-fit items-center justify-center'>
            <Eye /> {format10Thousands(viewCount)}
          </span>
          <span className='flex size-fit items-center justify-center'>・</span>
          <span className='flex size-fit items-center justify-center'>
            <Like /> {format10Thousands(likeCount)}
          </span>
          <span className='flex size-fit items-center justify-center'>・</span>

          <span className='flex size-fit items-center justify-center'>
            <Comment /> {formatThousands(commentCount)}
          </span>
          <span className='flex size-fit items-center justify-center'>・</span>
          <span className='flex size-fit items-center justify-center'>
            <Clock />
            {formatMonthAgo(publishedAt)}
          </span>
        </div>
      </div>
    </div>
  )
}
