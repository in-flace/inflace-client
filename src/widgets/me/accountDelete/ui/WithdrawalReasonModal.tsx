'use client'

import { useState } from 'react'
import { Select } from 'radix-ui'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import IconChevronDown from '@/shared/assets/down-bold.svg'
import IconX from '@/shared/assets/round-x.svg'
import IconCheck from '@/shared/assets/check-bold.svg'

import {
  WITHDRAWAL_REASONS,
  WITHDRAWAL_REASON_LABELS,
  type WithdrawalReason,
} from '@/features/me'

import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/shadcn/dialog'

const OTHER_REASON: WithdrawalReason = 'OTHER'

interface WithdrawalReasonModalProps {
  open: boolean
  onClose: () => void
  /* customReason은 reason === 'OTHER'일 때만 전달됨 (직접 입력 텍스트) */
  onConfirm: (reason: WithdrawalReason, customReason?: string) => void
  isSubmitting?: boolean
}

/* 모달 2 — 탈퇴 사유 선택 + 동의 체크 */
export function WithdrawalReasonModal({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
}: WithdrawalReasonModalProps) {
  const [reason, setReason] = useState<WithdrawalReason | ''>('')
  const [customReason, setCustomReason] = useState('')
  const [agreed, setAgreed] = useState(false)

  const isCustomMode = reason === OTHER_REASON
  const isCustomEmpty = customReason.trim() === ''

  const canSubmit =
    reason !== '' && (isCustomMode ? !isCustomEmpty : true) && agreed

  /* ▿ 클릭 — 탈퇴 사유 선택 dropdown 으로 복귀 */
  function handleBackToSelect() {
    setReason('')
    setCustomReason('')
  }

  /* X 클릭 — 입력 텍스트만 비움 (input 모드는 유지되지만 아이콘이 ▿로 변화) */
  function handleClearInput() {
    setCustomReason('')
  }

  function handleConfirm() {
    if (!canSubmit) return
    onConfirm(
      reason as WithdrawalReason,
      isCustomMode ? customReason.trim() : undefined
    )
  }

  /* 탈퇴 요청 진행 중에는 dim/ESC로 모달이 닫히지 않도록 차단 */
  function handleOpenChange(next: boolean) {
    if (next || isSubmitting) return
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName='bg-black/10 backdrop-blur-xs'
        className='flex w-[62.9rem] flex-col gap-32 rounded-16 bg-white p-40 shadow-[0_8px_24px_0_rgba(0,0,0,0.12)]'>
        <div className='flex flex-col gap-4'>
          <DialogTitle className='text-ibm-title-lg-normal text-text-and-icon-default'>
            탈퇴 사유 및 확인
          </DialogTitle>
          <p className='text-noto-body-xxs-normal text-text-and-icon-tertiary'>
            소중한 피드백은 서비스 개선에 활용됩니다
          </p>
        </div>

        <div className='flex w-full flex-col gap-12'>
          <div className='flex gap-4 text-noto-label-md-bold'>
            <span className='text-text-and-icon-primary'>탈퇴 사유</span>
            <span className='text-text-and-icon-tertiary'>(필수)</span>
          </div>

          {isCustomMode ? (
            <CustomReasonInput
              value={customReason}
              onChange={setCustomReason}
              onBack={handleBackToSelect}
              onClear={handleClearInput}
            />
          ) : (
            <Select.Root
              value={reason || undefined}
              onValueChange={(v) => setReason(v as WithdrawalReason)}>
              <Select.Trigger
                className={cn(
                  'group flex w-full cursor-pointer items-center justify-between gap-10 rounded-6 border border-stroke-border-gray-stronger bg-white px-16 py-12 text-left text-noto-label-md-normal transition-colors outline-none',
                  'data-placeholder:text-text-and-icon-disabled',
                  'not-data-placeholder:text-text-and-icon-primary'
                )}>
                <Select.Value placeholder='무엇이 불편하셨나요?' />
                <Select.Icon asChild>
                  <IconChevronDown className='size-20 text-text-and-icon-secondary transition-transform group-data-[state=open]:rotate-180' />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  position='popper'
                  sideOffset={8}
                  className='z-[60] max-h-[24rem] min-w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-6 border border-stroke-border-gray-default bg-white shadow-lg'>
                  <Select.Viewport className='p-4'>
                    {WITHDRAWAL_REASONS.map((r) => (
                      <Select.Item
                        key={r}
                        value={r}
                        className='flex cursor-pointer items-center rounded-4 px-12 py-10 text-noto-label-md-normal text-text-and-icon-primary outline-none select-none data-highlighted:bg-background-gray-default'>
                        <Select.ItemText>
                          {WITHDRAWAL_REASON_LABELS[r]}
                        </Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          )}
        </div>

        <div className='flex flex-col gap-2 rounded-12 border border-stroke-border-gray-default bg-background-gray-default p-24'>
          <label className='flex cursor-pointer items-center gap-12'>
            <button
              type='button'
              role='checkbox'
              aria-checked={agreed}
              onClick={() => setAgreed((p) => !p)}
              className={cn(
                'flex size-24 shrink-0 items-center justify-center rounded-6 border-[1.5px] transition-colors',
                agreed
                  ? 'border-brand-secondary bg-brand-secondary'
                  : 'border-brand-secondary/50 bg-white'
              )}>
              {agreed && <IconCheck className='size-12 text-white' />}
            </button>
            <div>
              <span className='text-noto-body-sm-bold whitespace-nowrap text-text-and-icon-default'>
                개인정보처리방침에 따라, 개인정보는 탈퇴 후 30일 동안 보관 후
                파기됩니다.
              </span>
              <p className='text-noto-body-xxs-normal text-text-and-icon-tertiary'>
                탈퇴 후 30일 이후에는 데이터 복구가 불가능합니다.
              </p>
            </div>
          </label>
        </div>

        <div className='flex w-full gap-12'>
          <Button
            type='button'
            color='secondary'
            variant='outlined'
            size='lg'
            onClick={onClose}
            disabled={isSubmitting}
            className='flex-1'>
            다시 생각해볼게요
          </Button>
          <Button
            type='button'
            color='secondary'
            variant='filled'
            size='lg'
            onClick={handleConfirm}
            disabled={!canSubmit || isSubmitting}
            className='flex-1'>
            {isSubmitting ? '처리 중...' : '계정 탈퇴하기'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface CustomReasonInputProps {
  value: string
  onChange: (next: string) => void
  /* ▿ 클릭 — 탈퇴 사유 선택 dropdown으로 복귀 */
  onBack: () => void
  /* X 클릭 — 입력 텍스트만 비움 */
  onClear: () => void
}

function CustomReasonInput({
  value,
  onChange,
  onBack,
  onClear,
}: CustomReasonInputProps) {
  const isEmpty = value.trim() === ''

  return (
    <div className='flex w-full items-center gap-10 rounded-6 border border-stroke-border-gray-stronger bg-white px-16 py-12'>
      <input
        type='text'
        autoFocus
        aria-label='탈퇴 사유 직접 입력'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='탈퇴 사유를 입력해주세요'
        className='flex-1 text-noto-label-md-normal text-text-and-icon-primary outline-none placeholder:text-text-and-icon-disabled'
      />
      {isEmpty ? (
        <button
          type='button'
          onClick={onBack}
          aria-label='탈퇴 사유 선택으로 돌아가기'
          className='flex cursor-pointer items-center'>
          <IconChevronDown className='size-20 text-text-and-icon-secondary' />
        </button>
      ) : (
        <button
          type='button'
          onClick={onClear}
          aria-label='입력 내용 지우기'
          className='flex cursor-pointer items-center'>
          <IconX className='size-20 text-text-and-icon-secondary' />
        </button>
      )}
    </div>
  )
}
