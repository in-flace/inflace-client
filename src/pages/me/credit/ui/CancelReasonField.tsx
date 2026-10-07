'use client'

import { useId, useRef } from 'react'
import { Select } from 'radix-ui'

import {
  SUBSCRIPTION_EXIT_REASON_DETAIL_MAX_LENGTH,
  SUBSCRIPTION_EXIT_REASONS,
  type SubscriptionExitReason,
} from '@/features/me/credit'
import IconChevronDown from '@/shared/assets/down-bold.svg'
import IconX from '@/shared/assets/round-x.svg'
import { cn } from '@/shared/lib/utils'

const FIELD_CLASS_NAME =
  'flex h-44 w-full items-center gap-10 rounded-6 border border-stroke-border-gray-stronger bg-white px-16 text-noto-label-md-normal'

/* 해지 사유 선택. 계정 탈퇴 모달과 같은 동작을 따른다 — 기타를 고르면 드롭다운이
 * 입력란으로 바뀌고, 비어 있을 때 ▿를 누르면 목록으로 돌아간다.
 * 기본값을 두지 않는다. 첫 항목이 미리 골라져 있으면 그대로 넘기는 사용자가 많아
 * 사유 데이터가 한쪽으로 쏠린다. */
export function CancelReasonField({
  reason,
  detail,
  onReasonChange,
  onDetailChange,
}: {
  reason: SubscriptionExitReason | ''
  detail: string
  onReasonChange: (reason: SubscriptionExitReason | '') => void
  onDetailChange: (detail: string) => void
}) {
  const labelId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const isOther = reason === 'OTHER'

  return (
    <div className='flex flex-col gap-8'>
      <span
        id={labelId}
        className='text-noto-body-xs-bold text-text-and-icon-primary'>
        해지 사유{' '}
        <span className='font-normal text-text-and-icon-tertiary'>(필수)</span>
      </span>

      {isOther ? (
        <div
          className={cn(
            FIELD_CLASS_NAME,
            'focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20'
          )}>
          <input
            ref={inputRef}
            type='text'
            autoFocus
            aria-labelledby={labelId}
            value={detail}
            maxLength={SUBSCRIPTION_EXIT_REASON_DETAIL_MAX_LENGTH}
            onChange={(event) => onDetailChange(event.target.value)}
            placeholder='해지 사유를 입력해주세요'
            autoComplete='off'
            className='min-w-0 flex-1 bg-transparent text-text-and-icon-primary outline-none placeholder:text-text-and-icon-disabled'
          />
          {detail.trim() === '' ? (
            <button
              type='button'
              onClick={() => {
                onDetailChange('')
                onReasonChange('')
              }}
              aria-label='해지 사유 목록으로 돌아가기'
              className='flex shrink-0 cursor-pointer items-center'>
              <IconChevronDown
                aria-hidden='true'
                className='size-20 text-text-and-icon-secondary'
              />
            </button>
          ) : (
            <button
              type='button'
              onClick={() => {
                onDetailChange('')
                /* 지우면 이 버튼이 ▿로 바뀌어 포커스가 사라진다. 지운 뒤엔
                 * 바로 다시 쓰는 경우가 많아 입력란으로 돌려놓는다. */
                inputRef.current?.focus()
              }}
              aria-label='입력 내용 지우기'
              className='flex shrink-0 cursor-pointer items-center'>
              <IconX
                aria-hidden='true'
                className='size-20 text-text-and-icon-secondary'
              />
            </button>
          )}
        </div>
      ) : (
        <Select.Root
          value={reason || undefined}
          onValueChange={(value) =>
            onReasonChange(value as SubscriptionExitReason)
          }>
          <Select.Trigger
            aria-labelledby={labelId}
            className={cn(
              FIELD_CLASS_NAME,
              'group cursor-pointer justify-between text-left outline-none focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20',
              'not-data-placeholder:text-text-and-icon-primary data-placeholder:text-text-and-icon-disabled'
            )}>
            <Select.Value placeholder='무엇이 불편하셨나요?' />
            <Select.Icon asChild>
              <IconChevronDown className='size-20 shrink-0 text-text-and-icon-secondary transition-transform group-data-[state=open]:rotate-180' />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            {/* 해지 모달(z-50) 위에 떠야 한다. 높이는 선택지 7개가 스크롤 없이
             * 다 보이게 잡는다 — 잘리면 맨 아래 "기타 직접 입력"이 있는 줄
             * 모르고 지나친다. 화면이 낮으면 남은 높이 안에서 스크롤된다. */}
            <Select.Content
              position='popper'
              sideOffset={8}
              className='z-[60] max-h-[min(32rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-6 border border-stroke-border-gray-default bg-white shadow-lg'>
              <Select.Viewport className='p-4'>
                {SUBSCRIPTION_EXIT_REASONS.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className='flex cursor-pointer items-center rounded-4 px-12 py-10 text-noto-label-md-normal text-text-and-icon-primary outline-none select-none data-highlighted:bg-background-gray-default'>
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      )}
    </div>
  )
}

/* 다음 단계로 넘어가도 되는지. 기타는 직접 입력이 비어 있으면 서버가 거부한다. */
export function isCancelReasonComplete(
  reason: SubscriptionExitReason | '',
  detail: string
): reason is SubscriptionExitReason {
  if (reason === '') return false
  return reason !== 'OTHER' || detail.trim() !== ''
}
