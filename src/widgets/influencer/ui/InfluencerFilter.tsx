'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

import { SearchBar } from '@/shared/ui/search-bar'
import { Button } from '@/shared/ui/button'
import IconHeart from '@/shared/assets/heart-bold.svg?react'
import IconLeftArrow from '@/shared/assets/leftwards-arrow-bold.svg?react'
import {
  DropdownTrigger,
  CategoryNamesDropdown,
  SubscriberDropdown,
  UploadPeriodDropdown,
  OutlierRangeDropdown,
  HasAdHistoryDropdown,
  EngagementRateDropdown,
  UPLOAD_PERIOD_OPTIONS,
  OUTLIER_RANGE_OPTIONS,
  SERVER_FILTER_DEFAULTS,
} from '@/features/influencer'
import type { YoutubeCategory } from '@/entities/youtubeCategory'

const UPLOAD_PERIOD_LABELS = Object.fromEntries(
  UPLOAD_PERIOD_OPTIONS.map((o: { label: string; value: string }) => [
    o.value,
    o.label,
  ])
)

const OUTLIER_RANGE_LABELS = Object.fromEntries(
  OUTLIER_RANGE_OPTIONS.map((o: { label: string; value: string }) => [
    o.value,
    o.label,
  ])
)

function deriveCategoryOutput(
  categoryIds: number[],
  categories: YoutubeCategory[]
): string {
  /* 미선택이어도 서버가 기본 카테고리로 좁힌다. '전체'라고 쓰면 거짓말이 된다. */
  if (categoryIds.length === 0) return '기본 카테고리'
  const labels = categories
    .filter((c) => categoryIds.includes(c.id))
    .map((c) => c.title)
  return labels.length === 1
    ? labels[0]
    : `${labels[0]} 외 ${labels.length - 1}`
}

/* 서버 스펙상 uploadPeriod는 값 하나만 받는다. 다중 선택 표기가 필요 없다. */
function deriveUploadPeriodOutput(value: string): string {
  if (!value) return '전체'
  return UPLOAD_PERIOD_LABELS[value] ?? value
}

function deriveSubscriberOutput(from: string, to: string): string {
  if (!from && !to) return '전체'
  return `${from || '0'}명 ~ ${to || ''}명`
}

/* 비워두면 '전체'가 아니라 서버 기본값(2~3%)이 걸린다.
 * 실제로 적용되는 값을 그대로 보여준다. */
function deriveEngagementRateOutput(from: string, to: string): string {
  return `${from || SERVER_FILTER_DEFAULTS.engagementRateFrom}% ~ ${
    to || SERVER_FILTER_DEFAULTS.engagementRateTo
  }%`
}

function deriveHasAdHistoryOutput(value: string): string {
  if (value === 'false') return '없음'
  if (value === 'true') return '있음'
  return '있음'
}

type InfluencerFilterProps = {
  categories: YoutubeCategory[]
}

export const InfluencerFilter = dynamic(
  () => Promise.resolve(InfluencerFilterInner),
  { ssr: false }
)

function InfluencerFilterInner({ categories }: InfluencerFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()!

  const categoryIds = searchParams.getAll('categoryIds').map(Number)
  const subscriberFrom = searchParams.get('subscriberFrom') ?? ''
  const subscriberTo = searchParams.get('subscriberTo') ?? ''
  const uploadPeriodValue = searchParams.get('uploadPeriod') ?? ''
  const hasAdHistoryValue = searchParams.get('hasAdHistory') ?? 'true'
  /* URL에 실제로 있는 값과, 서버가 적용하는 값을 구분한다.
   * 드롭다운에는 원본을 넘겨야 한다 — 기본값을 넣으면 입력 모드로 인식되어
   * 프리셋 선택이 통째로 막힌다. */
  const engagementRateFromParam = searchParams.get('engagementRateFrom') ?? ''
  const engagementRateToParam = searchParams.get('engagementRateTo') ?? ''
  const outlierRangeValue = searchParams.get('outlierRange') ?? ''

  const [query, setQuery] = useState(searchParams.get('channelName') ?? '')
  const [isFocused, setIsFocused] = useState(false)

  const searchParamsRef = useRef(searchParams)
  useEffect(() => {
    searchParamsRef.current = searchParams
  }, [searchParams])

  const updateUrl = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParamsRef.current?.toString())
      updater(params)
      router.replace(`${pathname}?${params.toString()}`)
    },
    [router, pathname]
  )

  const applyChannelNameToUrl = useCallback(
    (channelName: string) => {
      updateUrl((params) => {
        if (channelName) params.set('channelName', channelName)
        else params.delete('channelName')
      })
    },
    [updateUrl]
  )

  useEffect(() => {
    if (!isFocused) return
    const timer = setTimeout(() => {
      applyChannelNameToUrl(query)
    }, 500)
    return () => clearTimeout(timer)
  }, [query, isFocused, applyChannelNameToUrl])

  const isBookmarkPage = pathname === '/influencer/bookmarked'

  return (
    <div className='sticky top-header-height z-10 flex h-fit w-full flex-col items-center gap-16 bg-background-gray-default p-24'>
      {/** 보관함 페이지 헤더
       * /influencer/bookmarked일 때만 랜더링
       */}
      {isBookmarkPage && (
        <div className='flex h-[6.8rem] w-full gap-16 pt-24 pr-24 pb-16 pl-24'>
          <button
            type='button'
            onClick={() => router.push('/influencer')}
            className='flex size-24 shrink-0 items-center gap-10'>
            <IconLeftArrow className='size-full' />
          </button>
          <span className='size-fit w-full text-ibm-title-lg-normal text-text-and-icon-default'>
            보관함
          </span>
        </div>
      )}

      <div className='flex w-full items-center gap-24'>
        {/* 검색바 */}
        <SearchBar
          className='w-[50rem]'
          placeholder='채널명 또는 키워드 검색'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => {
            setQuery('')
            applyChannelNameToUrl('')
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              applyChannelNameToUrl(query)
              e.currentTarget.blur()
            }
          }}
        />

        {/* 필터 */}
        <div className='flex h-fit w-full flex-1 flex-wrap items-center gap-12'>
          <DropdownTrigger
            label='카테고리'
            output={deriveCategoryOutput(categoryIds, categories)}
            isModified={categoryIds.length > 0}
            onReset={() => updateUrl((params) => params.delete('categoryIds'))}>
            {(onClose) => (
              <CategoryNamesDropdown
                categories={categories}
                defaultValue={categoryIds}
                onChange={(_, ids) => {
                  updateUrl((params) => {
                    params.delete('categoryIds')
                    ids.forEach((id) =>
                      params.append('categoryIds', String(id))
                    )
                  })
                  onClose()
                }}
              />
            )}
          </DropdownTrigger>

          <DropdownTrigger
            label='구독자 수'
            output={deriveSubscriberOutput(subscriberFrom, subscriberTo)}
            isModified={Boolean(subscriberFrom || subscriberTo)}
            onReset={() =>
              updateUrl((params) => {
                params.delete('subscriberFrom')
                params.delete('subscriberTo')
              })
            }>
            {(onClose) => (
              <SubscriberDropdown
                defaultFrom={subscriberFrom}
                defaultTo={subscriberTo}
                onChange={(_, { from, to }) => {
                  updateUrl((params) => {
                    if (from) params.set('subscriberFrom', from)
                    else params.delete('subscriberFrom')
                    if (to) params.set('subscriberTo', to)
                    else params.delete('subscriberTo')
                  })
                  onClose()
                }}
              />
            )}
          </DropdownTrigger>

          <DropdownTrigger
            label='업로드 주기'
            output={deriveUploadPeriodOutput(uploadPeriodValue)}
            isModified={!!uploadPeriodValue}
            onReset={() =>
              updateUrl((params) => params.delete('uploadPeriod'))
            }>
            {(onClose) => (
              <UploadPeriodDropdown
                defaultValue={uploadPeriodValue}
                onChange={(_, value) => {
                  updateUrl((params) => {
                    if (value) params.set('uploadPeriod', value)
                    else params.delete('uploadPeriod')
                  })
                  onClose()
                }}
              />
            )}
          </DropdownTrigger>

          <DropdownTrigger
            label='광고 이력'
            output={deriveHasAdHistoryOutput(hasAdHistoryValue)}
            isModified={hasAdHistoryValue !== 'true'}
            onReset={() =>
              updateUrl((params) => params.delete('hasAdHistory'))
            }>
            {(onClose) => (
              <HasAdHistoryDropdown
                defaultValue={hasAdHistoryValue}
                onChange={(_, value) => {
                  updateUrl((params) => {
                    if (value) params.set('hasAdHistory', value)
                    else params.delete('hasAdHistory')
                  })
                  onClose()
                }}
              />
            )}
          </DropdownTrigger>

          <DropdownTrigger
            label='참여율'
            output={deriveEngagementRateOutput(
              engagementRateFromParam,
              engagementRateToParam
            )}
            isModified={Boolean(
              engagementRateFromParam || engagementRateToParam
            )}
            onReset={() =>
              updateUrl((params) => {
                params.delete('engagementRateFrom')
                params.delete('engagementRateTo')
              })
            }>
            {(onClose) => (
              <EngagementRateDropdown
                defaultFrom={engagementRateFromParam}
                defaultTo={engagementRateToParam}
                onChange={(_, { from, to }) => {
                  updateUrl((params) => {
                    if (from) params.set('engagementRateFrom', from)
                    else params.delete('engagementRateFrom')
                    if (to) params.set('engagementRateTo', to)
                    else params.delete('engagementRateTo')
                  })
                  onClose()
                }}
              />
            )}
          </DropdownTrigger>

          <DropdownTrigger
            label='Outlier 배수'
            output={OUTLIER_RANGE_LABELS[outlierRangeValue] ?? '전체'}
            isModified={Boolean(outlierRangeValue)}
            onReset={() =>
              updateUrl((params) => params.delete('outlierRange'))
            }>
            {(onClose) => (
              <OutlierRangeDropdown
                defaultValue={outlierRangeValue}
                onChange={(_, value) => {
                  updateUrl((params) => {
                    if (value) params.set('outlierRange', value)
                    else params.delete('outlierRange')
                  })
                  onClose()
                }}
              />
            )}
          </DropdownTrigger>

          {/* TODO: 기획단에서 언어와 관련된 필터값 논의중 */}
          <DropdownTrigger label='언어' output='한국어' />
        </div>

        {/* 보관함 버튼: /influencer 페이지에서만 노출 */}
        {!isBookmarkPage && (
          <Button
            color='primary'
            variant='outlined'
            size='sm'
            rightIcon={<IconHeart />}
            onClick={() => router.push('/influencer/bookmarked')}>
            보관함
          </Button>
        )}
      </div>
    </div>
  )
}
