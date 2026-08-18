'use client'

import { useState } from 'react'

import HeartBold from '@/shared/assets/heart-bold.svg'
import HeartFilled from '@/shared/assets/heart-filled.svg'

/* 북마크 여부는 이 버튼이 아니라 호출부(쿼리 캐시)가 소유한다.
 *
 * 이전에는 initialBookmarked로 내부 상태를 만들고 prop 변경을 무시했다.
 * 그러면 서버 요청이 실패해 캐시를 되돌려도 하트는 눌린 채로 남는다.
 * 되돌림이 화면에 반영되려면 표시 상태가 캐시를 따라가야 한다. */
interface HeartButtonProps {
  bookmarked: boolean
  onToggle: (bookmarked: boolean) => void
}

export function HeartButton({ bookmarked, onToggle }: HeartButtonProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      aria-label={bookmarked ? '찜 해제' : '찜 추가'}
      className='shrink-0'
      onClick={() => onToggle(!bookmarked)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      {bookmarked || hovered ? (
        <HeartFilled
          className={`size-[2.4rem] ${bookmarked ? 'text-[#FF7169]' : 'text-[#FF9F97]'}`}
        />
      ) : (
        <HeartBold className='size-[2.4rem] text-text-and-icon-tertiary' />
      )}
    </button>
  )
}
