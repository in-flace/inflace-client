import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { VideoCard } from './VideoCard'
import type { VideoCardItem } from '../model/types'

/* entities/videos의 VideoCard와 통합을 앞두고 현재 렌더 결과를 고정한다.
 * 같은 이름·같은 도메인이지만 실제로는 다른 카드다. 통합 결정을 위해
 * 차이를 테스트로 드러내 둔다.
 *
 *   이 카드            : 가로 배치, div, duration은 이미 포맷된 문자열,
 *                        지표는 참여율/CTR
 *   entities/videos    : 세로 배치, Link 래핑, duration은 초(number),
 *                        지표는 VPH/아웃라이어, AD 뱃지
 *
 * 공통은 썸네일·제목과 조회수/좋아요/댓글/게시일 네 지표이고, 이 넷은
 * 같은 format 함수를 쓴다. 통합한다면 그 부분이 후보다. */

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

/* formatMonthAgo가 new Date()를 읽으므로 시계를 고정한다. */
const NOW = '2026-08-11T00:00:00'

const baseItem: VideoCardItem = {
  id: 'video-1',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  title: '테스트 영상 제목',
  duration: '12:49',
  viewCount: 285000,
  likeCount: 9999,
  commentCount: 3700,
  publishedAt: '2026-05-11T00:00:00',
  engagementRate: 12.34,
  ctr: 5.678,
}

function renderCard(overrides: Partial<VideoCardItem> = {}) {
  return render(<VideoCard {...baseItem} {...overrides} />)
}

describe('VideoCard (entities/main)', () => {
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

    /* entities/videos의 카드와 갈리는 핵심 지점이다.
     * 이 카드는 링크가 없어 클릭해도 이동하지 않는다. id를 받으면서도 쓰지 않는다. */
    it('링크로 감싸지 않는다', () => {
      renderCard()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })

  describe('지표 포맷', () => {
    /* 네 지표의 포맷 규칙은 entities/videos 카드와 동일하다. */
    it('조회수·좋아요는 만 단위, 댓글은 천 단위로 표시한다', () => {
      renderCard()
      expect(screen.getByText('28.5만')).toBeInTheDocument()
      expect(screen.getByText('9999')).toBeInTheDocument()
      expect(screen.getByText('3.7천')).toBeInTheDocument()
    })

    it('게시일을 현재 시점 기준 경과 개월로 표시한다', () => {
      renderCard()
      expect(screen.getByText('3개월 전')).toBeInTheDocument()
    })

    /* 참여율·CTR은 공용 format 함수를 쓰지 않고 toFixed(1)을 직접 호출한다.
     * 그래서 null/undefined 방어가 없다. 타입이 number라 지금은 막혀 있지만,
     * API 응답이 null을 주면 런타임에서 깨진다(format 계열은 '0'을 돌려준다). */
    it('참여율과 CTR을 소수 첫째 자리까지 표시한다', () => {
      renderCard()
      expect(screen.getByText('참여율 12.3%')).toBeInTheDocument()
      expect(screen.getByText('CTR 5.7%')).toBeInTheDocument()
    })
  })

  describe('영상 길이', () => {
    /* 이 카드는 초가 아니라 포맷된 문자열을 그대로 받아 출력한다.
     * 즉 길이 표기 규칙이 이 컴포넌트 밖에 있다. entities/videos 카드는
     * formatDuration을 직접 호출하므로, 통합하려면 둘 중 하나로 정해야 한다. */
    it('전달받은 문자열을 그대로 표시한다', () => {
      renderCard({ duration: '1:02:05' })
      expect(screen.getByText('1:02:05')).toBeInTheDocument()
    })

    it('duration이 없으면 표시하지 않는다', () => {
      renderCard({ duration: undefined })
      expect(screen.queryByText('12:49')).not.toBeInTheDocument()
    })
  })
})
