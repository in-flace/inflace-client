'use client'

import { useEffect } from 'react'

import { cn } from '@/shared/lib/utils'
import IconLeftwardsArrow from '@/shared/assets/leftwards-arrow-bold.svg'

import { useScrollToTopVisible } from './scrollToTopStore'

interface ScrollToTopButtonProps {
  /* 표시 시작 스크롤 위치 (px). 기본 400 */
  threshold?: number
  className?: string
}

export function ScrollToTopButton({
  threshold = 400,
  className,
}: ScrollToTopButtonProps) {
  /* 표시 여부를 지역 상태가 아니라 스토어에 둔다.
   * 같은 코너를 쓰는 피드백 진입점이 이 값을 보고 비켜서야 한다. */
  const visible = useScrollToTopVisible((s) => s.isVisible)
  const setVisible = useScrollToTopVisible((s) => s.setVisible)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > threshold)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      /* 페이지를 벗어나면 버튼도 사라진다. 비켜서 있던 쪽을 되돌려야
       * 다른 페이지에서 코너가 빈 채로 남지 않는다. */
      setVisible(false)
    }
  }, [threshold, setVisible])

  function handleClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      type='button'
      onClick={handleClick}
      aria-label='맨 위로 스크롤'
      className={cn(
        'fixed right-32 bottom-32 z-40 flex size-56 cursor-pointer items-center justify-center rounded-full bg-brand-secondary text-white shadow-lg transition-opacity hover:opacity-90',
        className
      )}>
      <IconLeftwardsArrow className='size-24 rotate-90' />
    </button>
  )
}
