'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/shared/ui/button'
import { useScrollToTopVisible } from '@/shared/ui/scroll-to-top'
import { cn } from '@/shared/lib/utils'
import {
  useInquiryPanel,
  useSubmitInquiry,
  INQUIRY_CONTENT_MAX,
  INQUIRY_SUCCESS_CLOSE_DELAY,
  INQUIRY_PANEL_ID,
} from '@/features/inquiry'

const TITLE_ID = 'inquiry-panel-title'

/* 진입점 버튼 바로 위에 붙는다. 버튼이 비켜서면 패널도 같이 따라 올라가야
 * 간격이 유지된다. 32 + 56(버튼) + 16 = 104, 맨 위로 버튼이 끼면 +72. */
const PANEL_BOTTOM = 'bottom-[10.4rem]'
const PANEL_BOTTOM_RAISED = 'bottom-[17.6rem]'

export function InquiryPanel() {
  const close = useInquiryPanel((s) => s.close)
  const isScrollTopVisible = useScrollToTopVisible((s) => s.isVisible)

  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { mutate, isPending, isSuccess, isError } = useSubmitInquiry()

  const trimmed = content.trim()
  const canSubmit = trimmed.length > 0 && !isPending

  /* 열리자마자 바로 쓸 수 있도록 포커스를 준다.
   * 이 패널은 모달이 아니라 팝오버라 포커스 트랩은 두지 않는다. */
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  /* 성공 카드에는 닫기 버튼이 없다(디자인). 잠깐 보여주고 스스로 닫는다. */
  useEffect(() => {
    if (!isSuccess) return
    const timer = setTimeout(close, INQUIRY_SUCCESS_CLOSE_DELAY)
    return () => clearTimeout(timer)
  }, [isSuccess, close])

  /* ESC로 닫는다. 바깥 클릭으로는 닫지 않는다 —
   * 작성 중인 내용이 클릭 한 번에 날아가는 편이 더 나쁘다. */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isPending) close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [close, isPending])

  function handleSubmit() {
    if (!canSubmit) return
    mutate({ content: trimmed })
  }

  return (
    <div
      id={INQUIRY_PANEL_ID}
      role='dialog'
      aria-labelledby={TITLE_ID}
      className={cn(
        'fixed right-32 z-40 flex w-[36rem] flex-col rounded-16 border border-stroke-border-gray-default bg-white p-24 transition-[bottom]',
        'shadow-[0_4px_8px_0_rgba(14,38,70,0.16)]',
        isScrollTopVisible ? PANEL_BOTTOM_RAISED : PANEL_BOTTOM
      )}>
      {isSuccess ? (
        <PanelHeader
          title='소중한 의견 감사합니다 :)'
          description='피드백은 익명으로 전달되었어요.'
        />
      ) : (
        <>
          <PanelHeader
            title={
              isError
                ? '전송에 실패했습니다'
                : '사용 중 불편한 점이 생기셨나요?'
            }
            description={
              isError
                ? '다시 보내기 버튼을 눌러 다시 시도해주세요.'
                : '피드백은 익명으로 접수됩니다.'
            }
          />

          <textarea
            ref={textareaRef}
            aria-label='피드백 내용'
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={INQUIRY_CONTENT_MAX}
            disabled={isPending}
            placeholder='"버튼 위치가 어색해요", "이 기능도 생기면 좋겠어요" 등 생각나는 대로 편하게 적어주세요.'
            className={cn(
              'mt-16 h-[27.9rem] w-full resize-none rounded-12 border border-stroke-border-gray-stronger bg-white px-16 py-12 outline-none',
              'text-noto-body-sm-normal text-text-and-icon-default',
              'placeholder:text-text-and-icon-tertiary focus:border-brand-tertiary disabled:bg-background-gray-default'
            )}
          />

          {isError ? (
            <>
              <Button
                type='button'
                color='secondary'
                variant='filled'
                size='lg'
                onClick={handleSubmit}
                disabled={!canSubmit}
                className='mt-20 w-full justify-center bg-feedback-error text-noto-label-lg-bold'>
                {isPending ? '전송 중...' : '다시 보내기'}
              </Button>
              <Button
                type='button'
                color='gray'
                variant='filled'
                size='lg'
                onClick={close}
                disabled={isPending}
                className='mt-8 w-full justify-center text-noto-label-lg-bold'>
                닫기
              </Button>
            </>
          ) : (
            <Button
              type='button'
              color='secondary'
              variant='filled'
              size='lg'
              onClick={handleSubmit}
              disabled={!canSubmit}
              className='mt-20 w-full justify-center text-noto-label-lg-bold'>
              {isPending ? '전송 중...' : '피드백 보내기'}
            </Button>
          )}
        </>
      )}
    </div>
  )
}

interface PanelHeaderProps {
  title: string
  description: string
}

function PanelHeader({ title, description }: PanelHeaderProps) {
  return (
    <div className='flex flex-col gap-4'>
      <h2
        id={TITLE_ID}
        className='text-noto-title-lg-bold text-text-and-icon-default'>
        {title}
      </h2>
      <p className='text-noto-body-sm-normal text-text-and-icon-tertiary'>
        {description}
      </p>
    </div>
  )
}
