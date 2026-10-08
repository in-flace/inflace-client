'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
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
import { useAuth, useLoginModal } from '@/features/auth'
import { ScrollToTopButton } from '@/shared/ui/scroll-to-top'

const MAX_SELECTED = 10

/* 키워드 검색은 서버가 1회에 1크레딧을 쓴다(키워드 없는 기본 피드는 무료).
 * 거절되면 결과 영역이 조용히 비어 보이므로 사유와 갈 곳을 알려준다. */
const CREDIT_REJECTIONS: Record<
  string,
  { title: string; description: string; label: string; href: string }
> = {
  CREDIT_400_INSUFFICIENT: {
    title: '보유 크레딧이 부족합니다.',
    description: '키워드 검색 1회에 1크레딧이 사용됩니다.',
    label: '크레딧 구매',
    href: '/me/credit?tab=credit',
  },
  /* 무료 회원은 구매해 둔 크레딧이 없으면 키워드 검색을 할 수 없다 */
  AUTH_403: {
    title: '키워드 검색은 구독자 전용 기능입니다.',
    description: '플랜을 구독하면 크레딧이 매월 지급됩니다.',
    label: '구독하기',
    href: '/me/credit?tab=subscription',
  },
}

export function CompetitorPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { isLoggedIn, isInitializing } = useAuth()
  const openLoginModal = useLoginModal((s) => s.open)

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

  const {
    data,
    error,
    dataUpdatedAt,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useBrandCollaborations({ filter: appliedFilter })

  useEffect(() => {
    const code = isAxiosError(error) ? error.response?.data?.error?.code : null
    const rejection = typeof code === 'string' ? CREDIT_REJECTIONS[code] : null
    if (!rejection) return
    toast.error(rejection.title, {
      description: rejection.description,
      action: {
        label: rejection.label,
        onClick: () => router.push(rejection.href),
      },
    })
  }, [error, router])

  /* 키워드 검색이 성공하면 크레딧이 줄었을 수 있다. 결제 요약은 5분간 캐시되므로
   * 바로 크레딧 탭에 가도 줄어든 잔액이 보이게 낡은 것으로 표시해 둔다. */
  const isKeywordSearch = appliedFilter.includeKeywords.length > 0
  useEffect(() => {
    if (!isKeywordSearch || !dataUpdatedAt) return
    void queryClient.invalidateQueries({ queryKey: ['billing'] })
  }, [isKeywordSearch, dataUpdatedAt, queryClient])

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
    if (blockIfGuest()) return
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
    if (blockIfGuest()) return
    if (selectedVideoIds.size === 0) return
    setAnalyzedVideoIds(Array.from(selectedVideoIds))
  }

  /* '결과 더보기' — 다음 페이지 누적 */
  function handleLoadMore() {
    if (blockIfGuest()) return
    fetchNextPage()
  }

  /* 초기화 중 클릭은 통과 — 미로그인이면 axiosInstance의 401 인터셉터가 모달을 띄운다 */
  function blockIfGuest() {
    if (isInitializing || isLoggedIn) return false
    openLoginModal('competitor_gate')
    return true
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
          onLoadMore={handleLoadMore}
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
