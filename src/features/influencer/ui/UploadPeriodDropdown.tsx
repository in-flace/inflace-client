import { cn } from '@/shared/lib/utils'
import { UPLOAD_PERIOD_OPTIONS } from '../model/filterOptions'

/* 업로드 주기 드롭다운.
 *
 * 서버 스펙상 uploadPeriod는 열거값 하나만 받는다
 * (7D / 30D / 31_90D / 91_180D / 180D_PLUS).
 * 이전에는 다중 선택으로 받아 "7D,30D"처럼 콤마로 이어 보냈는데,
 * 그런 값은 열거에 없어 서버가 처리하지 못한다. UI를 계약에 맞춰 단일 선택으로 둔다.
 *
 * 같은 필터 바의 HasAdHistoryDropdown과 동작을 맞춘다 — 확인 버튼 없이 즉시 반영. */
type UploadPeriodDropdownProps = {
  defaultValue?: string
  onChange: (output: string, outputQuery: string) => void
}

function UploadPeriodDropdown({
  defaultValue = '',
  onChange,
}: UploadPeriodDropdownProps) {
  function handleSelect(option: { label: string; value: string }) {
    onChange(option.label, option.value)
  }

  return (
    <div className='flex h-fit w-[22.8rem] flex-col rounded-6 bg-white p-16 shadow-[0px_8px_12px_0px_var(--primitivecolortrasparent-brand-deep-900-transparent-16),0px_4px_6px_0px_var(--primitivecolortrasparent-brand-deep-900-transparent-24)]'>
      <ul className='flex h-fit w-full flex-col gap-2'>
        {UPLOAD_PERIOD_OPTIONS.map((option) => {
          const isSelected = defaultValue === option.value
          return (
            <li key={option.value}>
              <button
                type='button'
                onClick={() => handleSelect(option)}
                className={cn(
                  'flex h-fit w-full cursor-pointer items-center gap-10 rounded-6 p-16 text-noto-label-md-normal text-text-and-icon-secondary',
                  isSelected &&
                    'bg-btn-secondary-outlined-hover text-text-and-icon-default'
                )}>
                {option.label}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export { UploadPeriodDropdown }
