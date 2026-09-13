'use client'

import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { NEED_LABEL, Need } from '@/entities/user'

import IconChannelAnalysis from '@/shared/assets/IconChannelAnalysis.png'
import IconInfluencerSearch from '@/shared/assets/IconInfluencerSearch.png'
import IconYoutubeContentSearch from '@/shared/assets/IconYoutubeContentSearch.png'
import IconFakeSubscriberDetect from '@/shared/assets/IconFakeSubscriberDetect.png'
import IconCompetitorBenchmark from '@/shared/assets/IconCompetitorBenchmark.png'
import IconCollabProposal from '@/shared/assets/IconCollabProposal.png'
import IconInsightMagazine from '@/shared/assets/IconInsightMagazine.png'

const NEED_OPTIONS = [
  {
    value: 'CHANNEL_ANALYSIS' as Need,
    imgSrc: IconChannelAnalysis,
    label: NEED_LABEL.CHANNEL_ANALYSIS,
  },
  {
    value: 'INFLUENCER_SEARCH' as Need,
    imgSrc: IconInfluencerSearch,
    label: NEED_LABEL.INFLUENCER_SEARCH,
  },
  {
    value: 'YOUTUBE_CONTENT_SEARCH' as Need,
    imgSrc: IconYoutubeContentSearch,
    label: NEED_LABEL.YOUTUBE_CONTENT_SEARCH,
  },
  {
    value: 'FAKE_SUBSCRIBER_DETECT' as Need,
    imgSrc: IconFakeSubscriberDetect,
    label: NEED_LABEL.FAKE_SUBSCRIBER_DETECT,
  },
  {
    value: 'COMPETITOR_BENCHMARK' as Need,
    imgSrc: IconCompetitorBenchmark,
    label: NEED_LABEL.COMPETITOR_BENCHMARK,
  },
  {
    value: 'COLLAB_PROPOSAL' as Need,
    imgSrc: IconCollabProposal,
    label: NEED_LABEL.COLLAB_PROPOSAL,
  },
  {
    value: 'INSIGHT_MAGAZINE' as Need,
    imgSrc: IconInsightMagazine,
    label: NEED_LABEL.INSIGHT_MAGAZINE,
  },
]

interface NeedSelectProps {
  value: Need[]
  onChange: (value: Need[]) => void
}

/* 유저가 원하는 기능 선택 UI - 온보딩, 마이페이지 사용 */
export function NeedSelect({ value, onChange }: NeedSelectProps) {
  return (
    <div className='flex h-fit w-full flex-col gap-32'>
      {/* 상단 문구 */}
      <div className='flex h-fit w-full flex-col gap-4'>
        <h4 className='text-noto-title-sm-normal text-text-and-icon-default'>
          관심있는 기능을 모두 선택해주세요
        </h4>
        <span className='mt-4 text-noto-caption-md-normal text-text-and-icon-tertiary'>
          맞춤 콘텐츠를 제공해드려요
        </span>
      </div>
      <ToggleGroup
        type='multiple'
        size='fit'
        value={value}
        onValueChange={(v: string[]) => onChange(v as Need[])}>
        {NEED_OPTIONS.map((item) => (
          <ToggleGroupItem
            key={item.value}
            value={item.value}
            iconPosition='left'
            imgSrc={item.imgSrc.src}
            imgAlt={item.label}
            aria-label={item.label}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
