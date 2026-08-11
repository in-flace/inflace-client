import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { VideoCard } from './VideoCard'
import type { VideoCardItem } from '../model/types'

/* VideoCard 통합을 앞두고 현재 렌더 결과를 고정하는 특성화 테스트다.
 * entities/main/videoCard의 VideoCard와 합칠 예정인데, 두 카드는 같은 영상
 * 도메인을 그리면서도 레이아웃과 지표 구성이 다르다. 무엇이 실제로 화면에
 * 나가는지 먼저 고정해 두어야 통합 전후를 비교할 수 있다.
 *
 * 클래스는 단언하지 않는다. 이 컴포넌트가 소유한 것은 "어떤 값이 어떤 포맷으로
 * 나오는가"이고, 시각 회귀는 스토리와 Chromatic의 몫이다.
 *
 * 의도와 어긋나 보이는 동작은 BUG 주석으로 표시하고 실제 동작에 맞춰 통과시킨다.
 * 지금 고쳐버리면 통합 시점에 무엇이 바뀐 건지 구분할 수 없다. */

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    sizes: _sizes,
    ...props
  }: {
    src: string
    alt: string
    fill?: boolean
    sizes?: string
    [key: string]: unknown
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

/* formatMonthAgo가 new Date()를 읽으므로 시계를 고정하지 않으면
 * 게시일 단언이 시간이 지나면서 저절로 깨진다. */
const NOW = '2026-08-11T00:00:00'

const baseItem: VideoCardItem = {
  videoId: 42,
  title: '테스트 영상 제목',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  publishedAt: '2026-05-11T00:00:00',
  viewCount: 285000,
  likeCount: 9999,
  commentCount: 3700,
  vph: 3.456,
  outlierScore: 2.7,
  durationSeconds: 769,
  isShort: false,
  isAd: false,
}

function renderCard(overrides: Partial<VideoCardItem> = {}) {
  return render(<VideoCard {...baseItem} {...overrides} />)
}

describe('VideoCard (entities/videos)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('기본 렌더', () => {
    it('제목을 렌더하고 썸네일 alt로도 쓴다', () => {
      renderCard()
      expect(screen.getByText('테스트 영상 제목')).toBeInTheDocument()
      expect(screen.getByAltText('테스트 영상 제목')).toHaveAttribute(
        'src',
        'https://example.com/thumb.jpg'
      )
    })

    /* 카드 전체가 상세 페이지 링크다. main 쪽 VideoCard와 갈리는 지점이라
     * 통합 시 링크 유무를 어떻게 다룰지 결정해야 한다. */
    it('카드 전체를 영상 상세 링크로 감싼다', () => {
      renderCard()
      expect(screen.getByRole('link')).toHaveAttribute('href', '/videos/42')
    })
  })

  describe('지표 포맷', () => {
    it('조회수·좋아요는 만 단위, 댓글은 천 단위로 표시한다', () => {
      renderCard()
      expect(screen.getByText('28.5만')).toBeInTheDocument() // 285,000
      expect(screen.getByText('9999')).toBeInTheDocument() // 1만 미만은 원본
      expect(screen.getByText('3.7천')).toBeInTheDocument() // 3,700
    })

    it('게시일을 현재 시점 기준 경과 개월로 표시한다', () => {
      renderCard()
      expect(screen.getByText('3개월 전')).toBeInTheDocument()
    })

    it('VPH와 아웃라이어 점수를 배지 문구로 표시한다', () => {
      renderCard()
      expect(screen.getByText('시간당 3.46회')).toBeInTheDocument()
      expect(screen.getByText('평균 조회수 3배')).toBeInTheDocument()
    })

    /* outlierScore는 타입상 undefined가 될 수 있다.
     * formatPercent가 0을 돌려주므로 "평균 조회수 0배"가 화면에 나간다.
     * 값이 없는 것과 실제로 0배인 것이 구분되지 않는다. */
    it('outlierScore가 없으면 0배로 표시한다', () => {
      renderCard({ outlierScore: undefined })
      expect(screen.getByText('평균 조회수 0배')).toBeInTheDocument()
    })
  })

  describe('영상 길이', () => {
    it('초를 분:초로 표시한다', () => {
      renderCard()
      expect(screen.getByText('12:49')).toBeInTheDocument()
    })

    /* BUG: formatDuration이 시간 단위를 처리하지 않는다.
     * 1시간 넘는 영상은 "2:02:05"가 아니라 "122:05"로 표시된다.
     * 유튜브 롱폼에서 흔한 길이라 실제 화면에 노출된다. */
    it('1시간 이상도 분으로만 표시한다', () => {
      renderCard({ durationSeconds: 7325 })
      expect(screen.getByText('122:05')).toBeInTheDocument()
    })

    it('길이를 모르면 하이픈을 표시한다', () => {
      renderCard({ durationSeconds: undefined })
      expect(screen.getByText('-')).toBeInTheDocument()
    })
  })

  describe('광고 표시', () => {
    it('isAd면 AD 뱃지를 표시한다', () => {
      renderCard({ isAd: true })
      expect(screen.getByText('AD')).toBeInTheDocument()
    })

    it('isAd가 아니면 AD 뱃지가 없다', () => {
      renderCard({ isAd: false })
      expect(screen.queryByText('AD')).not.toBeInTheDocument()
    })
  })
})
