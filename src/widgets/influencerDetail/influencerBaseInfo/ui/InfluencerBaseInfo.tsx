'use client'
import Image from 'next/image'

import { useInfluencerDetail } from '@/features/influencerDetail'
import { useBookmarkToggle } from '@/features/influencer'
import { buttonVariants } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { format10Thousands } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import RedirectIcon from '@/shared/assets/redirect-bold.svg'
import { HashtagBox } from '@/shared/ui'
import { HeartButton } from '@/shared/ui/heart-button'

export function InfluencerBaseInfo({ channelId }: { channelId: string }) {
  const { data, isFetching, isError } = useInfluencerDetail(channelId)
  const toggleBookmark = useBookmarkToggle()

  if (isFetching || isError || !data) {
    return (
      <div className='h-fit w-full overflow-hidden rounded-10 bg-white shadow-[0_2px_6px_0_rgba(13,13,13,0.04)]'>
        <Skeleton className='relative h-[25.2rem] w-full' />
        <div className='relative'>
          <div className='absolute -top-[5rem] left-40 h-[10rem] w-[10rem] overflow-hidden rounded-full border-4 border-white'>
            <Skeleton className='h-full w-full' />
          </div>
          <div className='flex justify-between p-40 pt-[5.8rem]'>
            <div className='flex flex-col gap-20'>
              <div className='flex flex-col gap-10'>
                <div className='flex items-center'>
                  <Skeleton className='h-[3.2rem] w-[40rem]' />
                </div>
                <div className='flex gap-16'>
                  <Skeleton className='h-16 w-[20rem]' />
                </div>
              </div>
              <div className='flex'>
                <Skeleton className='h-28 w-[11.7rem]' />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='h-fit w-full overflow-hidden rounded-10 bg-white shadow-[0_2px_6px_0_rgba(13,13,13,0.04)]'>
      {/* 상단 채널 배경 이미지 */}
      <div className='relative h-[25.2rem] w-full'>
        <Image
          src={data.bannerImageUrl}
          alt='채널 배경이미지'
          fill
          sizes='100vw'
          className='object-cover'
        />
      </div>
      {/* 채널 정보 */}
      <div className='relative'>
        {/* 채널 프로필 이미지 */}
        <div className='absolute -top-[5rem] left-40 h-[10rem] w-[10rem] overflow-hidden rounded-full border-4 border-white'>
          <Image
            src={data.profileImageUrl}
            alt='채널 프로필'
            fill
            sizes='10rem'
          />
        </div>
        <div className='flex justify-between p-40 pt-[5.8rem]'>
          {/* 채널 정보 텍스트 */}
          <div className='flex flex-col gap-20'>
            <div className='flex flex-col gap-10'>
              <div className='flex items-center'>
                {/* 채널 제목 */}
                <p className='mr-8 text-ibm-heading-sm-bold'>
                  {data.channelName}
                </p>
                {/* 채널 카테고리 */}
                <div className='mr-12 flex gap-4'>
                  {data.categories.map((category) => (
                    <HashtagBox key={category} label={category} />
                  ))}
                </div>
                {/* 북마크 버튼 */}
                <HeartButton
                  bookmarked={data.bookmarked}
                  onToggle={(bookmarked) =>
                    toggleBookmark(Number(channelId), bookmarked)
                  }
                />
              </div>
              <div className='flex gap-16 text-noto-label-xs-normal text-text-and-icon-tertiary'>
                <span>{data.channelHandle}</span>
                <span
                  className={cn(
                    'relative',
                    'after:absolute after:top-1/2 after:-left-8 after:h-12 after:w-1 after:-translate-y-1/2 after:bg-text-and-icon-tertiary after:content-[""]'
                  )}>
                  가입일: {data.joinedAt}
                </span>
              </div>
            </div>
            <div className='flex'>
              <span className='rounded-6 bg-primitive-brand-vivid-100 p-4 px-16 text-noto-label-md-bold text-text-and-icon-primary'>
                구독자 {format10Thousands(data.subscriberCount)}
              </span>
            </div>
          </div>
          {/* 채널 공유하기 버튼 */}
          <a
            href={`https://www.youtube.com/${data.channelHandle}`}
            target='_blank'
            rel='noopener noreferrer'
            className={cn(
              buttonVariants({ color: 'gray', variant: 'outlined' }),
              'p-12 text-text-and-icon-secondary'
            )}>
            <RedirectIcon />
          </a>
        </div>
      </div>
    </div>
  )
}
