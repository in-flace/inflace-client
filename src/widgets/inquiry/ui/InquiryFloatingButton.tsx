'use client'

import { cn } from '@/shared/lib/utils'
import { useInquiryPanel, INQUIRY_PANEL_ID } from '@/features/inquiry'
import { useScrollToTopVisible } from '@/shared/ui/scroll-to-top'
import IconFeedback from '@/shared/assets/feedback-bold.svg'
import IconClose from '@/shared/assets/x-bold.svg'

interface InquiryFloatingButtonProps {
  className?: string
}

/* 패널이 열리면 X로 바뀐다. 패널 안에 별도 닫기 버튼이 없으므로
 * 이 버튼이 여는 곳이자 닫는 곳이다(디자인 state=closed / state=open). */
export function InquiryFloatingButton({
  className,
}: InquiryFloatingButtonProps) {
  const isOpen = useInquiryPanel((s) => s.isOpen)
  const toggle = useInquiryPanel((s) => s.toggle)
  const isScrollTopVisible = useScrollToTopVisible((s) => s.isVisible)

  const Icon = isOpen ? IconClose : IconFeedback

  return (
    <button
      type='button'
      onClick={toggle}
      aria-label={isOpen ? '피드백 닫기' : '피드백 보내기'}
      aria-expanded={isOpen}
      aria-controls={INQUIRY_PANEL_ID}
      /* 평소에는 코너에 있다가, 맨 위로 버튼이 나타나면 그 위(32 + 56 + 16)로
       * 비켜선다. 항상 올라가 있으면 버튼 아래가 빈 채로 남아 어색하다. */
      className={cn(
        'fixed right-32 z-40 flex size-56 cursor-pointer items-center justify-center rounded-full bg-brand-tertiary text-white transition-[bottom,opacity] hover:opacity-90',
        isScrollTopVisible ? 'bottom-[10.4rem]' : 'bottom-32',
        'shadow-[0_4px_8px_0_rgba(14,38,70,0.16)]',
        className
      )}>
      {/* x-bold.svg는 fill이 black으로 박혀 있어 fill-current로 덮어야 흰색이 된다 */}
      <Icon className='size-24 [&>path]:fill-current' />
    </button>
  )
}
