'use client'

import Image from 'next/image'
import Link from 'next/link'

import { format10Thousands } from '@/shared/lib/format'
import { HashtagBox } from '@/shared/ui/hashtag-box'
import { HeartButton } from '@/shared/ui/heart-button'
import type { Influencer } from '../model/types'

interface InfluencerCardProps {
  influencer: Influencer
  onBookmarkToggle?: (bookmarked: boolean) => void
}

export function InfluencerCard({ influencer, onBookmarkToggle }: InfluencerCardProps) {
  const {
    channelName,
    thumbnailUrl,
    categories,
    subscriberCount,
    averageViews,
    averageEngagementRate,
    recentUploadCount30d,
    recentPplBrands,
  } = influencer

  return (
    <div className='flex h-fit w-full min-w-[52.1rem] flex-col items-end gap-24 overflow-hidden rounded-12 border border-stroke-border-gray-default p-32'>
      {/* 콘텐츠 */}
      <div className='relative flex h-fit w-full flex-col gap-24'>
        {/* 배경 그라디언트 */}
        <div className='absolute top-[-3.2rem] right-[-3.2rem] left-[-3.2rem] h-[11.8rem] bg-gradient-to-b from-white via-[#fcfcfc] to-[#fafafa]' />

        <div className='relative flex h-fit w-full items-center gap-16'>
          {/* 채널 아이콘 */}
          <div className='relative size-[7.2rem] shrink-0 overflow-hidden rounded-full'>
            <Image src={thumbnailUrl} alt={channelName} fill sizes='72px' />
          </div>

          {/* 채널 이름, 해시태그, 좋아요 버튼 */}
          <div className='flex h-fit w-full flex-col gap-6'>
            <div className='flex h-fit w-full justify-between gap-4'>
              <span className='text-noto-label-lg-bold text-text-and-icon-default'>
                {channelName}
              </span>

              <HeartButton
                initialBookmarked={influencer.bookmarked}
                onToggle={onBookmarkToggle ?? (() => {})}
              />
            </div>

            {/* 해시태그 */}
            <div className='flex h-fit w-full flex-wrap gap-8'>
              {categories.map((category) => (
                <HashtagBox key={category} label={category} />
              ))}
            </div>
          </div>
        </div>

        <div className='flex h-fit w-full flex-col gap-24 px-8'>
          {/* 통계 */}
          <div className='flex h-[5.4rem] w-full gap-24'>
            <div className='flex h-[5.4rem] w-full flex-col gap-8'>
              <span className='text-noto-label-sm-thin text-text-and-icon-tertiary'>
                구독자
              </span>
              <span className='text-ibm-title-lg-thin text-[#121212]'>
                {format10Thousands(subscriberCount)}
              </span>
            </div>
            <div className='flex h-[5.4rem] w-full flex-col gap-8'>
              <span className='text-noto-label-sm-thin text-text-and-icon-tertiary'>
                평균 조회수
              </span>
              <span className='text-ibm-title-lg-thin text-[#121212]'>
                {format10Thousands(averageViews)}
              </span>
            </div>
            <div className='flex h-[5.4rem] w-full flex-col gap-8'>
              <span className='text-noto-label-sm-thin text-text-and-icon-tertiary'>
                평균 참여율
              </span>
              <span className='text-ibm-title-lg-thin text-[#121212]'>
                {averageEngagementRate.toFixed(1)}%
              </span>
            </div>
            <div className='flex h-[5.4rem] w-full flex-col gap-8'>
              <span className='text-noto-label-sm-thin whitespace-nowrap text-text-and-icon-tertiary'>
                최근 30일 업로드
              </span>
              <span className='text-ibm-title-lg-thin text-[#121212]'>
                {recentUploadCount30d}회
              </span>
            </div>
          </div>

          {/**최근 PPL 브랜드
           * PPL 브랜드 관련 로직 백엔드에서 논의중
           */}
          <div className='flex size-fit flex-col gap-8'>
            <span className='text-noto-label-sm-thin text-text-and-icon-tertiary'>
              최근 PPL 브랜드
            </span>

            <div className='flex size-fit flex-wrap gap-12'>
              {recentPplBrands.map((brand) => (
                <span
                  key={brand}
                  className='text-noto-label-md-bold text-brand-tertiary-stronger'>
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 채널 분석 보기 */}
      <Link
        href={`/influencer/${influencer.channelId}`}
        className='flex h-fit shrink-0 items-center justify-center gap-10 rounded-6 bg-background-gray-stronger px-16 py-8 text-noto-label-md-normal text-text-and-icon-primary'>
        채널 분석 보기 →
      </Link>
    </div>
  )
}
