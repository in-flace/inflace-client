import { useState } from 'react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

/* 경계를 비워두면 안 된다. 서버는 미입력을 "무제한"이 아니라 기본값으로 채운다
 * (engagementRateFrom 2.0 / engagementRateTo 3.0). 그래서 예전의
 * { from: '5', to: '' }는 서버에서 5~3 구간이 되어 항상 0건이었고,
 * { from: '', to: '1' }은 2~1이 되어 마찬가지였다.
 * 양끝을 명시적인 숫자로 둔다. */
const ENGAGEMENT_RATE_MAX = '100'

const ENGAGEMENT_RATE_OPTIONS: {
  label: string
  from: string
  to: string
}[] = [
  { label: '1% 미만', from: '0', to: '1' },
  { label: '1% ~ 2%', from: '1', to: '2' },
  { label: '2% ~ 3%', from: '2', to: '3' },
  { label: '3% ~ 5%', from: '3', to: '5' },
  { label: '5% 이상', from: '5', to: ENGAGEMENT_RATE_MAX },
]

type SelectedOption = { from: string; to: string }

type EngagementRateQuery = { from: string; to: string }

type EngagementRateDropdownProps = {
  defaultSelectedOptions?: SelectedOption[]
  defaultFrom?: string
  defaultTo?: string
  onChange: (output: string, query: EngagementRateQuery) => void
}

function EngagementRateDropdown({
  defaultSelectedOptions = [],
  defaultFrom = '',
  defaultTo = '',
  onChange,
}: EngagementRateDropdownProps) {
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>(
    defaultSelectedOptions
  )
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)

  const isInputMode = from !== '' || to !== ''
  const isSelectMode = selectedOptions.length > 0

  function toggleOption(option: SelectedOption) {
    /* 직접 입력 모드일 때 select 선택 불가 */
    if (isInputMode) return

    setSelectedOptions((prev) => {
      const exists = prev.some(
        (o) => o.from === option.from && o.to === option.to
      )
      return exists
        ? prev.filter((o) => !(o.from === option.from && o.to === option.to))
        : [...prev, option]
    })
  }

  function handleFromChange(value: string) {
    /* 직접 입력 시 select 선택 초기화 */
    if (selectedOptions.length > 0) setSelectedOptions([])
    setFrom(value)
  }

  function handleToChange(value: string) {
    if (selectedOptions.length > 0) setSelectedOptions([])
    setTo(value)
  }

  function handleConfirm() {
    if (isInputMode) {
      /* 한쪽만 입력해도 반대쪽을 비워 보내면 안 된다. 서버가 빈 쪽을 기본값으로
       * 채우기 때문에 "7% 이상"이 7~3 구간이 되어 결과가 0건이 된다.
       * 프리셋과 같은 규칙으로 양끝을 채운다. */
      const normalizedFrom = from || '0'
      const normalizedTo = to || ENGAGEMENT_RATE_MAX
      onChange(`${normalizedFrom}% ~ ${normalizedTo}%`, {
        from: normalizedFrom,
        to: normalizedTo,
      })
      return
    }

    const labels = ENGAGEMENT_RATE_OPTIONS.filter((o) =>
      selectedOptions.some((s) => s.from === o.from && s.to === o.to)
    ).map((o) => o.label)

    const output =
      labels.length === 0
        ? '전체'
        : labels.length === 1
          ? labels[0]
          : `${labels[0]} 외 ${labels.length - 1}`

    const froms = selectedOptions.map((o) => o.from)
    const tos = selectedOptions.map((o) => o.to)
    const hasOpenFrom = froms.some((f) => f === '')
    const hasOpenTo = tos.some((t) => t === '')
    const mergedFrom = hasOpenFrom ? '' : String(Math.min(...froms.map(Number)))
    const mergedTo = hasOpenTo ? '' : String(Math.max(...tos.map(Number)))
    onChange(output, { from: mergedFrom, to: mergedTo })
  }

  const isMinMaxInvalid =
    isInputMode && from !== '' && to !== '' && Number(from) > Number(to)

  const isSameAsDefault =
    selectedOptions.length === defaultSelectedOptions.length &&
    selectedOptions.every((s) =>
      defaultSelectedOptions.some((d) => d.from === s.from && d.to === s.to)
    ) &&
    from === defaultFrom &&
    to === defaultTo

  const isConfirmDisabled = isSameAsDefault || isMinMaxInvalid

  return (
    <div className='flex h-fit w-[32rem] flex-col rounded-6 bg-white p-16 shadow-[0px_8px_12px_0px_var(--primitivecolortrasparent-brand-deep-900-transparent-16),0px_4px_6px_0px_var(--primitivecolortrasparent-brand-deep-900-transparent-24)]'>
      {/* 선택 옵션 */}
      <ul className='flex h-fit w-full flex-col gap-2'>
        {ENGAGEMENT_RATE_OPTIONS.map((option) => {
          const isSelected = selectedOptions.some(
            (s) => s.from === option.from && s.to === option.to
          )
          return (
            <li key={option.label}>
              <button
                type='button'
                onClick={() => toggleOption(option)}
                disabled={isInputMode}
                className={cn(
                  'flex h-fit w-full cursor-pointer items-center gap-10 rounded-6 p-16 text-noto-label-md-normal text-text-and-icon-secondary',
                  isSelected &&
                    'bg-btn-secondary-outlined-hover text-text-and-icon-default',
                  isInputMode && 'cursor-not-allowed opacity-40'
                )}>
                {option.label}
              </button>
            </li>
          )
        })}
      </ul>

      {/* 직접 입력 */}
      <div className='mt-2 flex h-fit w-full flex-col gap-10 rounded-b-6 border-t border-stroke-border-gray-default bg-background-gray-default p-16'>
        <span className='text-noto-label-md-normal text-text-and-icon-disabled'>
          5% 이상
        </span>

        <div className='flex h-fit w-full items-center gap-10'>
          <div className='flex h-fit w-full items-center gap-4'>
            <input
              type='number'
              min={5}
              max={100}
              placeholder='min'
              value={from}
              disabled={isSelectMode}
              onChange={(e) => handleFromChange(e.target.value)}
              className='flex h-fit w-full flex-1 [appearance:textfield] items-center rounded-6 border bg-white px-16 py-12 text-noto-label-md-normal text-text-and-icon-secondary outline-none placeholder:text-text-and-icon-tertiary disabled:cursor-not-allowed disabled:opacity-40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
            />
            <span className='text-noto-label-md-normal text-text-and-icon-secondary'>
              %
            </span>
          </div>

          <span className='text-noto-label-md-normal text-text-and-icon-secondary'>
            ~
          </span>

          <div className='flex h-fit w-full items-center gap-4'>
            <input
              type='number'
              min={5}
              max={100}
              placeholder='max'
              value={to}
              disabled={isSelectMode}
              onChange={(e) => handleToChange(e.target.value)}
              className='flex h-fit w-full flex-1 [appearance:textfield] items-center rounded-6 border bg-white px-16 py-12 text-noto-label-md-normal text-text-and-icon-secondary outline-none placeholder:text-text-and-icon-tertiary disabled:cursor-not-allowed disabled:opacity-40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
            />
            <span className='text-noto-label-md-normal text-text-and-icon-secondary'>
              %
            </span>
          </div>
        </div>
      </div>

      <div className='mt-16 flex justify-end'>
        <Button
          color='secondary'
          variant='filled'
          size='sm'
          disabled={isConfirmDisabled}
          onClick={handleConfirm}>
          완료
        </Button>
      </div>
    </div>
  )
}

export { EngagementRateDropdown }
export type { EngagementRateQuery }
