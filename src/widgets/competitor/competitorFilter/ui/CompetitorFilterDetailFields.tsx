'use client'

import { useMemo } from 'react'
import { Select } from 'radix-ui'
import { cn } from '@/shared/lib/utils'
import { KeywordChipInput } from '@/shared/ui/keyword-chip-input'
import IconChevronDown from '@/shared/assets/down-bold.svg'
import IconX from '@/shared/assets/round-x.svg'
import {
  REGION_OPTIONS,
  LANGUAGE_OPTIONS,
  type CompetitorFilterState,
  type SelectOption,
} from '@/features/competitor'
import { useYoutubeCategories } from '@/entities/youtubeCategory'

interface CompetitorFilterDetailFieldsProps {
  filter: CompetitorFilterState
  onChange: <K extends keyof CompetitorFilterState>(
    key: K,
    value: CompetitorFilterState[K]
  ) => void
}

export function CompetitorFilterDetailFields({
  filter,
  onChange,
}: CompetitorFilterDetailFieldsProps) {
  const { data: categoriesData } = useYoutubeCategories()
  /* YouTube 카테고리 응답(id: number)을 SelectOption(value: string)으로 변환 */
  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      categoriesData?.youtubeCategories.map((c) => ({
        value: String(c.id),
        label: c.title,
      })) ?? [],
    [categoriesData]
  )

  return (
    <div className='flex w-full flex-col gap-40'>
      {/* 제외 키워드 */}
      <div className='flex w-full flex-col gap-12'>
        <p className='text-noto-label-md-bold text-text-and-icon-primary'>
          제외 키워드
        </p>
        <KeywordChipInput
          chips={filter.excludeKeywords}
          onChange={(chips) => onChange('excludeKeywords', chips)}
          placeholder='검색에서 제외할 키워드를 입력해주세요 (최대 5개)'
          maxChips={5}
          variant='secondary'
        />
      </div>

      {/* 카테고리 / 지역 / 언어 */}
      <div className='flex flex-wrap items-start gap-64'>
        <DropdownField
          label='카테고리'
          value={filter.categoryId}
          onChange={(v) => onChange('categoryId', v)}
          options={categoryOptions}
          placeholder='카테고리 선택'
        />
        <DropdownField
          label='지역 코드'
          value={filter.regionCode}
          onChange={(v) => onChange('regionCode', v)}
          options={REGION_OPTIONS}
          placeholder='지역코드 선택'
        />
        <DropdownField
          label='언어'
          value={filter.languageCode}
          onChange={(v) => onChange('languageCode', v)}
          options={LANGUAGE_OPTIONS}
          placeholder='언어 선택'
        />
      </div>

      {/* 최소 수치 */}
      <div className='flex flex-wrap items-start gap-64'>
        <NumberField
          label='최소 조회수'
          value={filter.minViews}
          onChange={(v) => onChange('minViews', v)}
          placeholder='예: 1000'
        />
        <NumberField
          label='최소 좋아요 수'
          value={filter.minLikes}
          onChange={(v) => onChange('minLikes', v)}
          placeholder='예: 1000'
        />
        <NumberField
          label='최소 댓글 수'
          value={filter.minComments}
          onChange={(v) => onChange('minComments', v)}
          placeholder='예: 1000'
        />
      </div>
    </div>
  )
}

/* ───────── 내부 컴포넌트 ───────── */

function DropdownField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  placeholder: string
}) {
  return (
    <div className='flex min-w-[18rem] flex-1 flex-col gap-12'>
      <p className='text-noto-label-md-bold text-text-and-icon-primary'>
        {label}
      </p>
      <Select.Root
        key={value || 'empty'}
        value={value || undefined}
        onValueChange={(v) => onChange(v)}>
        <Select.Trigger
          className={cn(
            'group flex w-full cursor-pointer items-center justify-between gap-10 rounded-6 border border-stroke-border-gray-stronger bg-white px-16 py-12 text-left text-noto-label-md-normal transition-colors outline-none',
            'data-placeholder:text-text-and-icon-disabled',
            'not-data-placeholder:text-text-and-icon-primary'
          )}>
          <Select.Value placeholder={placeholder} />
          <Select.Icon asChild>
            <IconChevronDown className='size-20 text-text-and-icon-secondary transition-transform group-data-[state=open]:rotate-180' />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position='popper'
            sideOffset={8}
            className={cn(
              'z-50 max-h-[24rem] min-w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-6 border border-stroke-border-gray-default bg-white shadow-lg',
              'data-open:animate-in data-open:fade-in-0',
              'data-closed:animate-out data-closed:fade-out-0'
            )}>
            <Select.Viewport className='p-4'>
              {options.map(({ value: v, label }) => (
                <Select.Item
                  key={v}
                  value={v}
                  className={cn(
                    'flex cursor-pointer items-center rounded-4 px-12 py-10 text-noto-label-md-normal text-text-and-icon-primary outline-none select-none',
                    'data-highlighted:bg-background-gray-default',
                    'data-disabled:pointer-events-none data-disabled:opacity-50'
                  )}>
                  <Select.ItemText>{label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className='flex min-w-[18rem] flex-1 flex-col gap-12'>
      <p className='text-noto-label-md-bold text-text-and-icon-primary'>
        {label}
      </p>
      <div className='flex w-full items-center gap-24 rounded-6 border border-stroke-border-gray-stronger bg-white px-16 py-12 has-[input:focus]:border-brand-secondary'>
        <input
          type='number'
          inputMode='numeric'
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            /* min-w-0: input은 기본 최소 폭(size 속성 기준, Safari는 더 넓음)보다 줄어들지 않아
             * 필드가 좁으면 X 버튼을 필드 밖으로 밀어낸다 */
            'min-w-0 flex-1 text-noto-label-md-normal text-text-and-icon-primary outline-none placeholder:text-text-and-icon-disabled',
            /* number input 스피너 제거 */
            '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
          )}
        />
        {value && (
          <button
            type='button'
            onClick={() => onChange('')}
            aria-label={`${label} 초기화`}
            className='flex shrink-0 cursor-pointer items-center'>
            <IconX className='size-20 text-text-and-icon-secondary' />
          </button>
        )}
      </div>
    </div>
  )
}
