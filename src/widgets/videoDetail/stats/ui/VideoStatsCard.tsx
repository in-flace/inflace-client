import { type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { formatKoreanUnit } from '@/shared/lib/format'
import type { KpiMetric } from '@/entities/video'
import IconQuestion from '@/shared/assets/question-bold.svg'
import { Tooltip } from '@/shared/ui/tooltip'

type ValueFormat = 'korean' | 'percent' | 'float'

interface VideoStatsCardProps {
  icon: ReactNode
  label: string
  description?: string
  hasTooltip?: boolean
  tooltipLabel?: string
  metric?: KpiMetric | null
  valueFormat: ValueFormat
}

/* 카드 폭에 따라 끊기는 위치가 달라지지 않도록 줄바꿈 지점을 고정한다(QA #72) */
const NO_DATA_MESSAGE_LINES = [
  '데이터가 충분히 모이지 않아',
  '분석 결과를 제공할 수 없어요',
]

function formatValue(value: number, format: ValueFormat): string {
  switch (format) {
    case 'korean':
      return formatKoreanUnit(value)
    case 'percent': {
      const n = Number.isInteger(value) ? value : parseFloat(value.toFixed(1))
      return `${n}%`
    }
    case 'float':
      return Number.isInteger(value) ? String(value) : value.toFixed(1)
  }
}

function ChangeRateBadge({ changeRate }: { changeRate: number | null }) {
  if (changeRate === null) {
    return (
      <span className='text-noto-title-sm-bold text-text-and-icon-secondary'>
        —
      </span>
    )
  }

  const isPositive = changeRate >= 0
  const sign = isPositive ? '+' : ''
  const formatted = Number.isInteger(changeRate)
    ? changeRate
    : parseFloat(changeRate.toFixed(1))

  return (
    <span
      className={cn(
        'text-noto-title-sm-bold',
        isPositive
          ? 'text-[var(--color-dashboard-positive)]'
          : 'text-[var(--color-dashboard-negative)]'
      )}>
      {`${sign}${formatted}%`}
    </span>
  )
}

export function VideoStatsCard({
  icon,
  label,
  description,
  hasTooltip = false,
  tooltipLabel,
  metric,
  valueFormat,
}: VideoStatsCardProps) {
  /* 폭은 VideoStatsSection의 grid 열(554px)이 정한다.
   * 높이는 데스크톱 내용(최대 56px) + 여백 64px로 항상 120px이 되고,
   * 좁은 화면에서 문구가 줄바꿈될 때만 늘어나도록 min-h로 둔다.
   * @max-[554px]: 카드 영역(@container)이 554px보다 좁아지는(모바일 1열) 경우 좌우 배치 대신 위아래로 쌓는다 */
  return (
    <div className='flex min-h-[12rem] w-full min-w-0 items-center gap-24 rounded-12 bg-white p-32 shadow-[0px_2px_6px_0px_rgba(13,13,13,0.04)] @max-[554px]:flex-col @max-[554px]:items-stretch @max-[554px]:gap-16 @max-[554px]:p-24'>
      {/* 왼쪽: 아이콘 + 레이블 */}
      <div className='flex min-w-0 flex-1 items-center gap-16'>
        <div className='flex shrink-0 items-center rounded-[1.5rem] bg-background-neutral-default p-5'>
          <div className='flex size-[3rem] items-center justify-center'>
            {icon}
          </div>
        </div>
        <div className='flex min-w-0 flex-1 flex-col gap-4'>
          <p className='text-noto-title-sm-normal text-text-and-icon-primary'>
            {label}
          </p>
          {description && (
            <div className='z-2 flex items-center gap-2'>
              {/* nowrap이면 폭이 모자랄 때 오른쪽 값 영역 밑으로 넘쳐 겹친다 */}
              <p className='text-noto-caption-md-normal text-text-and-icon-secondary'>
                {description}
              </p>
              {hasTooltip && tooltipLabel && (
                <Tooltip side='top' align='center' label={tooltipLabel}>
                  <button type='button' aria-label={`${label} 지표 안내 보기`}>
                    <IconQuestion className='size-16 text-text-and-icon-disabled' />
                  </button>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽: 값 + 채널 평균 비교 (지표 미수집 시 안내 문구) */}
      {metric != null && metric.value != null ? (
        <div className='flex min-w-0 flex-1 flex-col items-end gap-2 @max-[554px]:items-start'>
          <p className='w-full text-right text-ibm-heading-sm-normal text-text-and-icon-primary @max-[554px]:text-left'>
            {formatValue(metric.value, valueFormat)}
          </p>
          <div className='flex w-full items-center justify-end gap-6 whitespace-nowrap @max-[554px]:justify-start'>
            <span className='text-noto-caption-md-normal text-text-and-icon-secondary'>
              채널 평균보다
            </span>
            <ChangeRateBadge changeRate={metric.changeRate} />
          </div>
        </div>
      ) : (
        <div className='flex min-w-0 flex-1 items-center justify-end @max-[554px]:justify-start'>
          <p className='text-right text-noto-caption-md-normal text-text-and-icon-secondary @max-[554px]:text-left'>
            {NO_DATA_MESSAGE_LINES.map((line) => (
              <span key={line} className='block'>
                {line}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  )
}
