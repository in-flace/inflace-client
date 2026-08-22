'use client'

import { useState } from 'react'
import { XIcon } from 'lucide-react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import {
  useInquiryModal,
  useSubmitInquiry,
  INQUIRY_CONTENT_MIN,
  INQUIRY_CONTENT_MAX,
} from '@/features/inquiry'

export function InquiryModal() {
  const isOpen = useInquiryModal((s) => s.isOpen)
  const close = useInquiryModal((s) => s.close)

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close()
      }}>
      {/* 입력값·에러·완료 상태는 전부 InquiryDialogContent가 들고 있다.
       * 모달이 닫히면 Radix가 이 트리를 언마운트하므로 다음에 열릴 때
       * 자동으로 빈 폼이 된다. 이펙트로 되돌릴 필요가 없다. */}
      <InquiryDialogContent onClose={close} />
    </Dialog>
  )
}

function InquiryDialogContent({ onClose }: { onClose: () => void }) {
  const [content, setContent] = useState('')
  const [isDone, setIsDone] = useState(false)

  const { mutate, isPending, isError, error } = useSubmitInquiry()

  const trimmed = content.trim()
  const canSubmit = trimmed.length >= INQUIRY_CONTENT_MIN && !isPending

  function handleSubmit() {
    if (!canSubmit) return

    mutate({ content: trimmed }, { onSuccess: () => setIsDone(true) })
  }

  /* 전송 중에는 dim 클릭·ESC로 닫히지 않게 막는다.
   * 응답 전에 닫으면 접수 여부를 사용자가 알 방법이 없다. */
  function blockWhilePending(e: Event | KeyboardEvent) {
    if (isPending) e.preventDefault()
  }

  return (
    <DialogContent
      showCloseButton={false}
      overlayClassName='bg-background-dim-default'
      onEscapeKeyDown={blockWhilePending}
      onInteractOutside={blockWhilePending}
      className='flex h-fit w-[48rem] max-w-[48rem]! flex-col gap-24 rounded-16 bg-white p-40'>
      <DialogClose asChild>
        <button
          type='button'
          aria-label='닫기'
          disabled={isPending}
          className='absolute top-24 right-24 flex size-32 cursor-pointer items-center justify-center rounded-full bg-background-gray-default text-text-and-icon-tertiary disabled:cursor-not-allowed disabled:opacity-40'>
          <XIcon className='size-16' />
        </button>
      </DialogClose>

      {isDone ? (
        <DoneView onClose={onClose} />
      ) : (
        <>
          <div className='flex flex-col gap-8'>
            <DialogTitle className='text-ibm-heading-lg-bold text-text-and-icon-default'>
              무엇을 도와드릴까요?
            </DialogTitle>
            <DialogDescription className='text-noto-body-md-normal text-text-and-icon-primary'>
              아래 양식에 맞춰 문제를 보내주시면,
              <br />
              운영팀이 빠르게 파악하여 해결해드립니다.
            </DialogDescription>
          </div>

          <div className='flex flex-col gap-12'>
            <div className='flex items-baseline justify-between'>
              <label
                htmlFor='inquiry-content'
                className='text-noto-label-md-bold text-text-and-icon-primary'>
                문의 내용
              </label>
              <span className='text-noto-body-xxs-normal text-text-and-icon-tertiary'>
                {content.length} / {INQUIRY_CONTENT_MAX}
              </span>
            </div>

            <textarea
              id='inquiry-content'
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={INQUIRY_CONTENT_MAX}
              disabled={isPending}
              rows={7}
              placeholder='어떤 문제가 있었는지 알려주세요.'
              aria-describedby='inquiry-content-help'
              className={cn(
                'w-full resize-none rounded-6 border border-stroke-border-gray-stronger bg-white px-16 py-12 text-noto-label-md-normal text-text-and-icon-primary outline-none',
                'placeholder:text-text-and-icon-disabled focus:border-brand-primary disabled:bg-background-gray-default'
              )}
            />

            <p
              id='inquiry-content-help'
              className='text-noto-body-xxs-normal text-text-and-icon-tertiary'>
              카드번호 등 민감정보는 입력하지 마세요.
            </p>
          </div>

          {isError && (
            <p
              role='alert'
              className='text-noto-body-sm-normal text-feedback-error'>
              {error instanceof Error
                ? error.message
                : '문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.'}
            </p>
          )}

          <Button
            type='button'
            color='primary'
            variant='filled'
            size='lg'
            onClick={handleSubmit}
            disabled={!canSubmit}
            className='w-full justify-center'>
            {isPending ? '전송 중...' : '문의보내기'}
          </Button>
        </>
      )}
    </DialogContent>
  )
}

/* 전송 성공 화면.
 * 토스트(sonner)는 Toaster가 어디에도 마운트돼 있지 않아 쓸 수 없다.
 * 모달 안에서 상태를 바꾸는 편이 추가 설정 없이 확실하다. */
function DoneView({ onClose }: { onClose: () => void }) {
  return (
    <div className='flex flex-col gap-24'>
      <div className='flex flex-col gap-8'>
        <DialogTitle className='text-ibm-heading-lg-bold text-text-and-icon-default'>
          문의가 접수되었습니다
        </DialogTitle>
        <DialogDescription className='text-noto-body-md-normal text-text-and-icon-primary'>
          운영팀이 내용을 확인한 뒤 순차적으로 처리해드립니다.
        </DialogDescription>
      </div>

      <Button
        type='button'
        color='primary'
        variant='filled'
        size='lg'
        onClick={onClose}
        className='w-full justify-center'>
        확인
      </Button>
    </div>
  )
}
