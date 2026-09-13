'use client'

import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/shadcn/dialog'
import { Button } from '@/shared/ui/button'
import IconX from '@/shared/assets/x.svg'

import { DELETION_ITEMS } from '../model/withdrawalConfig'

interface DataDeletionModalProps {
  open: boolean
  onClose: () => void
  onNext: () => void
}

/* 모달 1 — 탈퇴 시 삭제되는 데이터 안내 */
export function DataDeletionModal({
  open,
  onClose,
  onNext,
}: DataDeletionModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName='bg-black/10 backdrop-blur-xs'
        className='flex max-h-[calc(100vh-3.2rem)] w-[62.9rem] flex-col gap-32 overflow-y-auto rounded-16 bg-white p-40 shadow-[0_8px_24px_0_rgba(0,0,0,0.12)]'>
        <DialogTitle className='text-ibm-title-lg-normal text-feedback-error'>
          탈퇴 시 삭제되는 데이터
        </DialogTitle>

        <ul className='flex flex-col gap-32'>
          {DELETION_ITEMS.map((item) => (
            <li key={item.title} className='flex items-start gap-12'>
              <span
                aria-hidden='true'
                className='flex shrink-0 items-center justify-center rounded-full border border-feedback-error p-[0.4rem]'>
                <IconX className='size-[1.4rem] text-feedback-error' />
              </span>
              <div className='flex flex-col gap-4'>
                <p className='text-noto-body-sm-bold text-text-and-icon-primary'>
                  {item.title}
                </p>
                <p className='text-noto-body-xxs-normal text-text-and-icon-tertiary'>
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className='flex w-full gap-32'>
          <Button
            type='button'
            color='secondary'
            variant='outlined'
            size='lg'
            onClick={onClose}
            className='flex-1'>
            다시 생각해볼게요
          </Button>
          <Button
            type='button'
            color='secondary'
            variant='filled'
            size='lg'
            onClick={onNext}
            leftIcon={<IconX />}
            className='flex-1'>
            계정 탈퇴하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
