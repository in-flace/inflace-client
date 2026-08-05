import Image from 'next/image'
import type { AdvertisementVideoItem } from '../model/types'
import { HashtagBox } from '@/shared/ui'
import {
  format10Thousands,
  formatThousands,
  formatMonthAgo,
} from '@/shared/lib/format'
import IconEye from '@/shared/assets/eye-thin.svg'
import IconLike from '@/shared/assets/like-thin.svg'
import IconComment from '@/shared/assets/comment-thin.svg'
import IconClock from '@/shared/assets/clock-thin.svg'

export function AdvertisementCard({
  video,
}: {
  video: AdvertisementVideoItem
}) {
  const {
    videoTitle,
    videoThumbnailUrl,
    publishedAt,
    viewCount,
    likeCount,
    commentCount,
    categoryName,
    brands,
  } = video
  return (
    <div className='h-fit overflow-hidden rounded-6 border border-stroke-border-gray-default'>
      {/* 카드 상단 (이미지 + AD 뱃지) */}
      <div className='relative min-h-[29.2rem]'>
        <Image
          src={videoThumbnailUrl ?? ''}
          alt={videoTitle ?? ''}
          fill
          sizes='520px'
          className='object-cover'
        />
        <span className='absolute top-16 left-16 rounded-4 bg-primitive-brand-clear-200 p-12 py-4 text-noto-caption-sm-bold text-text-and-icon-primary'>
          AD
        </span>
      </div>
      {/* 카드 하단 */}
      <div className='flex flex-col gap-16 p-24 pt-16'>
        <div className='flex flex-col gap-8'>
          {/* 해시태그 */}
          <div>
            <HashtagBox label={categoryName ?? ''} />
          </div>
          {/* 영상 타이틀 */}
          <p className='line-clamp-2 text-noto-title-sm-normal text-text-and-icon-default'>
            {videoTitle}
          </p>
          {/* 영상 정보 */}
          <div className='flex size-fit gap-12 py-2 text-noto-caption-md-normal text-text-and-icon-secondary'>
            <span className='flex size-fit items-center gap-4'>
              <IconEye className='size-16' /> {format10Thousands(viewCount)}
            </span>
            <span className='flex size-fit items-center gap-4'>
              <IconLike className='size-16' /> {format10Thousands(likeCount)}
            </span>
            <span className='flex size-fit items-center gap-4'>
              <IconComment className='size-16' />
              {formatThousands(commentCount)}
            </span>
            <span className='flex size-fit items-center gap-4'>
              <IconClock className='size-16' />
              {formatMonthAgo(publishedAt ?? '')}
            </span>
          </div>
        </div>
        {/* 협찬 브랜드 */}
        <div className='flex gap-12 border-t border-stroke-border-gray-default pt-16'>
          <span className='text-noto-label-md-normal text-text-and-icon-secondary'>
            협찬 브랜드
          </span>
          {brands.map((brand) => (
            <span
              className='text-noto-label-md-bold text-brand-tertiary-stronger'
              key={brand}>
              {brand}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
