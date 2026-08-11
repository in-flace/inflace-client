'use client'

import * as React from 'react'
import {
  DayPicker,
  useDayPicker,
  type MonthCaptionProps,
  type DayPickerProps,
} from 'react-day-picker'

import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import IconLeftArrow from './assets/leftwards-triangle-bold.svg?react'
import IconRightArrow from './assets/rightwards-triangle-bold.svg?react'
import IconTilde from './assets/tilde.svg?react'

type CalendarRootProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode
  rootRef?: React.Ref<HTMLDivElement>
  onConfirm?: () => void
  confirmDisabled?: boolean
}

/* 달력 컨테이너 */
function CalendarContainer({
  rootRef,
  children,
  onConfirm,
  confirmDisabled,
  ...props
}: CalendarRootProps) {
  return (
    <div data-slot='calendar' ref={rootRef} {...props}>
      {children}
      {onConfirm && (
        <div className='mt-20 flex justify-end'>
          <Button
            variant='filled'
            color='secondary'
            size='xs'
            disabled={confirmDisabled}
            onClick={onConfirm}>
            완료
          </Button>
        </div>
      )}
    </div>
  )
}

/* 달력 헤더: 좌우 화살표 + 캡션 텍스트 */
function CalendarHeader({ calendarMonth }: MonthCaptionProps) {
  const { goToMonth, dayPickerProps } = useDayPicker()
  const { year, month } = formatDate(calendarMonth.date.toISOString())

  const thisDate = calendarMonth.date
  const prevMonth = new Date(thisDate.getFullYear(), thisDate.getMonth() - 1, 1)
  const nextMonthDate = new Date(
    thisDate.getFullYear(),
    thisDate.getMonth() + 1,
    1
  )

  const { startMonth, endMonth } = dayPickerProps
  const isPrevDisabled = startMonth != null && prevMonth < startMonth
  const isNextDisabled = endMonth != null && nextMonthDate > endMonth

  return (
    <div className='flex w-full items-center justify-center gap-12'>
      <button
        aria-label='이전 달'
        disabled={isPrevDisabled}
        onClick={() => goToMonth(prevMonth)}
        className='size-fit gap-10 p-2 select-none disabled:opacity-50'>
        <IconLeftArrow className='size-[1.8rem]' />
      </button>
      {/* 월 표시 ex. 2026년 4월 */}
      <span className='text-noto-label-sm-normal text-text-and-icon-default select-none'>
        {year}년 {month}월
      </span>
      <button
        aria-label='다음 달'
        disabled={isNextDisabled}
        onClick={() => goToMonth(nextMonthDate)}
        className='size-fit gap-10 p-2 select-none disabled:opacity-50'>
        <IconRightArrow className='size-[1.8rem]' />
      </button>
    </div>
  )
}

/* 날짜 셀 버튼 (ex. 17, 18) */
function CalendarDayButton({
  className,
  modifiers,
  ...props
}: React.ComponentProps<'button'> & {
  modifiers: Record<string, boolean>
}) {
  /* 키보드로 날짜 이동 시 focus */
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <button
      ref={ref}
      data-range-start={modifiers.range_start && !modifiers.outside}
      data-range-end={modifiers.range_end && !modifiers.outside}
      data-range-middle={modifiers.range_middle && !modifiers.outside}
      className={cn(
        /* 레이아웃 */
        'relative isolate z-10 flex aspect-square size-[2.8rem] items-center justify-center',
        /* 타이포그래피 */
        'text-noto-label-sm-thin text-text-and-icon-secondary',
        /* 기본 스타일 초기화 */
        'cursor-pointer! rounded-full! border-none',
        /* 범위 시작/끝 선택 상태 */
        'data-[range-start=true]:bg-brand-secondary data-[range-start=true]:text-white!',
        'data-[range-end=true]:bg-brand-secondary data-[range-end=true]:text-white!',
        /* 범위 중간 상태 (outside 제외) */
        'data-[range-middle=true]:bg-background-gray-stronger',
        /* 단일 선택 상태 */
        'data-[selected-single=true]:bg-primary',
        /* 아직 오지 않은 날짜 */
        modifiers.disabled && 'cursor-not-allowed! opacity-30',
        /* 날짜 hover */
        'hover:bg-btn-secondary-outlined-hover',
        className
      )}
      {...props}
    />
  )
}

/* 달력 두 개를 독립 state로 나란히 렌더링 */
function DualCalendar({
  onConfirm,
  confirmDisabled,
  defaultMonth,
  disabled,
  ...sharedProps
}: DayPickerProps & {
  onConfirm?: () => void
  confirmDisabled?: boolean
}) {
  const today = new Date()
  const initialLeft =
    defaultMonth instanceof Date
      ? defaultMonth
      : new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const initialRight = new Date(
    initialLeft.getFullYear(),
    initialLeft.getMonth() + 1,
    1
  )

  const [leftMonth, setLeftMonth] = React.useState<Date>(initialLeft)
  const [rightMonth, setRightMonth] = React.useState<Date>(initialRight)

  const classNames = {
    /* 달력 1개 컨테이너 */
    month: cn('flex w-fit flex-col gap-20'),

    /* 헤더 숨김 */
    nav: 'hidden',
    button_previous: 'hidden',
    button_next: 'hidden',

    /* 요일 셀 레이아웃 */
    weekdays: cn('hidden'),
    month_grid: cn('w-[23.2rem]'),
    week: cn('grid grid-cols-7 gap-x-6 gap-y-8'),

    /* 범위 선택 스타일 */
    range_start: cn('rounded-full'),
    range_middle: cn('rounded-full'),
    range_end: cn('rounded-full'),
  }

  const components = {
    MonthCaption: (props: MonthCaptionProps) => <CalendarHeader {...props} />,
    DayButton: (
      props: React.ComponentProps<'button'> & {
        modifiers: Record<string, boolean>
      }
    ) => <CalendarDayButton {...props} />,
  } as DayPickerProps['components']

  return (
    <div
      data-slot='calendar'
      className={cn(
        'size-fit gap-20 p-24',
        'overflow-hidden rounded-8 bg-white',
        'shadow-[0px_8px_12px_0px_var(--primitivecolortrasparent-neutral-neutral-950-transparent-16),0px_4px_6px_0px_var(--primitivecolortrasparent-brand-deep-900-transparent-24)]'
      )}>
      <div className='flex size-fit gap-24'>
        {/* 왼쪽 달력 */}
        <DayPicker
          showOutsideDays={false}
          month={leftMonth}
          onMonthChange={setLeftMonth}
          disabled={disabled}
          classNames={classNames}
          components={components}
          {...sharedProps}
        />

        {/* ~ */}
        <div className='text-text-and-icon-disabled'>
          <IconTilde />
        </div>

        {/* 오른쪽 달력 */}
        <DayPicker
          showOutsideDays={false}
          month={rightMonth}
          onMonthChange={setRightMonth}
          disabled={disabled}
          classNames={classNames}
          components={components}
          {...sharedProps}
        />
      </div>
      {onConfirm && (
        <div className='mt-20 flex justify-end'>
          <Button
            variant='filled'
            color='secondary'
            size='xs'
            disabled={confirmDisabled}
            onClick={onConfirm}>
            완료
          </Button>
        </div>
      )}
    </div>
  )
}

/* 캘린더 컴포넌트 */
function Calendar({
  onConfirm,
  confirmDisabled,
  numberOfMonths,
  ...props
}: DayPickerProps & {
  onConfirm?: () => void
  confirmDisabled?: boolean
}) {
  const isRangeComplete =
    props.mode === 'range' &&
    'selected' in props &&
    typeof props.selected === 'object' &&
    props.selected !== null &&
    'from' in props.selected &&
    'to' in props.selected &&
    props.selected.from != null &&
    props.selected.to != null

  /* 기본 비활성 규칙("범위를 다 고르기 전에는 확정 불가")은 range 모드에만 해당한다.
   * mode를 보지 않고 !isRangeComplete를 쓰면 isRangeComplete가 range에서만 참이 될 수
   * 있으므로, range가 아닌 달력에 onConfirm을 넘기면 완료 버튼이 영원히 비활성이었다. */
  const resolvedConfirmDisabled =
    confirmDisabled ??
    (onConfirm != null && props.mode === 'range' ? !isRangeComplete : undefined)

  if (numberOfMonths === 2) {
    return (
      <DualCalendar
        onConfirm={onConfirm}
        confirmDisabled={resolvedConfirmDisabled}
        {...props}
      />
    )
  }

  return (
    <DayPicker
      showOutsideDays={false} // 이전 월의 요일을 표시=false (ex. 3월 31일이 월요일이라면 4월 달력에 31일 표시=false)
      classNames={{
        /* 컨테이너 레이아웃 */
        /* 전체 컨테이너 */
        root: cn(
          /* 레이아웃 & 사이즈 */
          'size-fit gap-20 p-24',
          /* 모양 */
          'overflow-hidden rounded-8 bg-white',
          /* 그림자  */
          'shadow-[0px_8px_12px_0px_var(--primitivecolortrasparent-neutral-neutral-950-transparent-16),0px_4px_6px_0px_var(--primitivecolortrasparent-brand-deep-900-transparent-24)]'
        ),
        /* 달력 2개 컨테이너 */
        months: cn('flex size-fit gap-24'),
        /* 달력 1개 컨테이너 */
        month: cn('flex w-fit flex-col gap-20'),

        /* 헤더 숨김 */
        nav: 'hidden',
        button_previous: 'hidden',
        button_next: 'hidden',

        /* 요일 셀 레이아웃 */
        weekdays: cn('hidden'),
        month_grid: cn('w-[23.2rem]'),
        week: cn('grid grid-cols-7 gap-x-6 gap-y-8'),

        /* 범위 선택 스타일 */
        range_start: cn('rounded-full'),
        range_middle: cn('rounded-full'),
        range_end: cn('rounded-full'),
      }}
      components={{
        Root: ({ rootRef, children, ...rootProps }) => (
          <CalendarContainer
            rootRef={rootRef}
            onConfirm={onConfirm}
            confirmDisabled={resolvedConfirmDisabled}
            {...rootProps}>
            {children}
          </CalendarContainer>
        ),
        MonthCaption: (props) => <CalendarHeader {...props} />,
        DayButton: (props) => <CalendarDayButton {...props} />,
      }}
      {...props}
    />
  )
}

export { Calendar }
