'use client'

import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/shadcn/dialog'
import { Button } from '@/shared/ui/button'

interface WithdrawalCompletedModalProps {
  open: boolean
  onGoHome: () => void
}

/* 모달 3 — 탈퇴 완료 안내 */
export function WithdrawalCompletedModal({
  open,
  onGoHome,
}: WithdrawalCompletedModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onGoHome()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName='bg-black/10 backdrop-blur-xs'
        className='flex w-[34.1rem] flex-col items-center gap-32 rounded-16 bg-white p-40 shadow-[0_8px_24px_0_rgba(0,0,0,0.12)]'>
        <div className='flex flex-col gap-4'>
          <DialogTitle className='text-ibm-title-lg-normal text-text-and-icon-default'>
            탈퇴 처리가 완료되었습니다.
          </DialogTitle>
          <p className='text-noto-body-xxs-normal text-text-and-icon-tertiary'>
            지금까지 인플레이스를 이용해주셔서 감사합니다.
          </p>
        </div>
        <Button
          type='button'
          color='secondary'
          variant='outlined'
          size='lg'
          onClick={onGoHome}>
          홈으로 이동하기
        </Button>
      </DialogContent>
    </Dialog>
  )
}
