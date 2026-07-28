'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import AiInsightIcon from '@/shared/assets/ai-strategy-insight.svg'

import {
  CompetitorFilterPanel,
  CompetitorInsightSection,
  CompetitorResultSection,
  CompetitorSelectionBar,
} from '@/widgets/competitor'
import {
  DEFAULT_COMPETITOR_FILTER,
  useBrandCollaborations,
  type CompetitorFilterState,
  type SortCriteria,
} from '@/features/competitor'
import { ScrollToTopButton } from '@/shared/ui/scroll-to-top'

const MAX_SELECTED = 10

export function CompetitorPage() {
  const queryClient = useQueryClient()

  /* 사용자가 입력 중인 필터 (편집 상태) */
  const [draftFilter, setDraftFilter] = useState<CompetitorFilterState>(
    DEFAULT_COMPETITOR_FILTER
  )

  /* 검색하기로 확정된 필터 — 초기 진입 시 기본 필터로 기본 영상 피드를 노출 */
  const [appliedFilter, setAppliedFilter] = useState<CompetitorFilterState>(
    DEFAULT_COMPETITOR_FILTER
  )

  /* 선택된 영상 ID 집합 (최대 10개) */
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(
    new Set()
  )

  /* 분석 트리거된 영상 ID 배열 — '영상 분석하기' 클릭 시 선택 영상의 스냅샷 */
  const [analyzedVideoIds, setAnalyzedVideoIds] = useState<string[]>([])

  /* 상세 검색 영역 열림 상태 — 분석 완료 시 자동 닫기 위해 페이지에서 관리 (기본 펼침) */
  const [isDetailOpen, setIsDetailOpen] = useState(true)

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useBrandCollaborations({ filter: appliedFilter })

  const videos = data?.pages.flatMap((page) => page.content) ?? []
  const hasResults = videos.length > 0

  function handleChange<K extends keyof CompetitorFilterState>(
    key: K,
    value: CompetitorFilterState[K]
  ) {
    setDraftFilter((prev) => ({ ...prev, [key]: value }))
  }

  /* 초기화: 편집 필터 + 적용 필터(기본 피드) + 선택/분석 영상 모두 초기 상태로 */
  function handleReset() {
    setDraftFilter(DEFAULT_COMPETITOR_FILTER)
    setAppliedFilter(DEFAULT_COMPETITOR_FILTER)
    setSelectedVideoIds(new Set())
    setAnalyzedVideoIds([])
  }

  /* 검색: 편집 필터를 확정. 동일 조건 재검색 시에도 강제 refetch */
  function handleSearch() {
    setAppliedFilter(draftFilter)
    setSelectedVideoIds(new Set())
    setAnalyzedVideoIds([])
    queryClient.invalidateQueries({ queryKey: ['brand-collaborations'] })
  }

  /* 정렬 변경: 검색 결과에 즉시 반영 */
  function handleSortChange(next: SortCriteria) {
    setAppliedFilter({ ...appliedFilter, sortCriteria: next })
  }

  function handleToggleSelect(videoId: string) {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev)
      if (next.has(videoId)) {
        next.delete(videoId)
        return next
      }
      if (next.size >= MAX_SELECTED) {
        toast(`최대 ${MAX_SELECTED}개까지 선택 가능합니다.`)
        return prev
      }
      next.add(videoId)
      return next
    })
  }

  /* Clear All: 선택 영상 + 분석 결과만 초기화 (검색 필터/영상 리스트 유지) */
  function handleClearSelection() {
    setSelectedVideoIds(new Set())
    setAnalyzedVideoIds([])
  }

  /* '영상 분석하기' — 현재 선택 영상으로 trends 분석 트리거 */
  function handleAnalyze() {
    if (selectedVideoIds.size === 0) return
    setAnalyzedVideoIds(Array.from(selectedVideoIds))
  }

  return (
    <div className='flex w-full flex-col bg-white pb-96'>
      <CompetitorFilterPanel
        filter={draftFilter}
        onChange={handleChange}
        onReset={handleReset}
        onSearch={handleSearch}
        isDetailOpen={isDetailOpen}
        onDetailOpenChange={setIsDetailOpen}
      />

      <div className='flex w-full flex-col gap-16 px-24 pt-24'>
        <AnalysisInsightCard hasResults={hasResults} />

        {analyzedVideoIds.length > 0 && (
          <CompetitorInsightSection
            videoIds={analyzedVideoIds}
            onAnalysisComplete={() => setIsDetailOpen(false)}
          />
        )}

        <CompetitorSelectionBar
          count={selectedVideoIds.size}
          max={MAX_SELECTED}
          onReset={handleClearSelection}
          onAnalyze={handleAnalyze}
        />

        <CompetitorResultSection
          videos={videos}
          selectedVideoIds={selectedVideoIds}
          onToggleSelect={handleToggleSelect}
          sortCriteria={appliedFilter.sortCriteria}
          onSortChange={handleSortChange}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      </div>

      <ScrollToTopButton />
    </div>
  )
}

function AnalysisInsightCard({ hasResults }: { hasResults: boolean }) {
  return (
    <div className='flex w-full flex-col items-center gap-24 overflow-hidden rounded-16 bg-background-gray-default p-32'>
      <div className='flex flex-col items-center gap-12'>
        <AiInsightIcon className='size-24 text-text-and-icon-disabled' />
        <p className='text-ibm-title-lg-thin text-text-and-icon-primary'>
          AI 분석 인사이트
        </p>
      </div>
      <div className='text-center text-noto-body-xs-normal text-text-and-icon-secondary'>
        <p>
          {hasResults
            ? '조회된 영상 중 1개 이상을 선택한 후, 영상 분석하기 버튼을 누르면 분석이 시작됩니다.'
            : '검색을 시작하면 결과가 이곳에 표시됩니다.'}
        </p>
        <p>
          유료 광고 영상들 중, 강조되는 내용 및 주요 키워드, 채널 특성을 분석한
          리포트를 제공합니다.
        </p>
        <p className='mt-16 text-noto-label-md-normal text-text-and-icon-primary'>
          * 영상은 최대 10개까지 선택 가능합니다.
        </p>
      </div>
    </div>
  )
}
