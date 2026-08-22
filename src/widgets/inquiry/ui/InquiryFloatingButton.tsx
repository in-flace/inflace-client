'use client'

import { cn } from '@/shared/lib/utils'
import { useInquiryModal } from '@/features/inquiry'
import IconQuestion from '@/shared/assets/question-mark-bold.svg'

interface InquiryFloatingButtonProps {
  className?: string
}

export function InquiryFloatingButton({
  className,
}: InquiryFloatingButtonProps) {
  const open = useInquiryModal((s) => s.open)

  return (
    <button
      type='button'
      onClick={open}
      aria-label='문의하기'
      /* ScrollToTopButton도 right-32 bottom-32 z-40을 쓴다(현재는 경쟁사 페이지 전용).
       * 나중에 두 버튼이 같은 화면에 놓이면 한쪽을 bottom-104로 올려야 한다. */
      className={cn(
        'fixed right-32 bottom-32 z-40 flex size-56 cursor-pointer items-center justify-center rounded-full bg-brand-primary text-white shadow-lg transition-opacity hover:opacity-90',
        className
      )}>
      <IconQuestion className='size-28' />
    </button>
  )
}
