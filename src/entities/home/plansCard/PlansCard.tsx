import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { PlansCardItem } from '@/entities/home/plansCard/config/types'

import IconCheck from '@/shared/assets/check-bold.svg'

export function PlansCard({
  planName,
  price,
  period,
  features,
  buttonLabel,
  highlighted = false,
  badge,
}: PlansCardItem) {
  return (
    /* 배지가 카드 위쪽으로 걸치므로 기준점이 필요하다.
     * 이 카드는 overflow를 자르지 않아야 배지가 잘리지 않는다. */
    <div
      className={cn(
        'relative flex min-h-[36.7rem] flex-col justify-between rounded-12 border p-32',
        highlighted
          ? 'border-brand-primary/24 bg-primitive-brand-vivid-75'
          : 'border-stroke-border-gray-default bg-white'
      )}>
      {badge && (
        <span className='absolute -top-20 right-0 rounded-8 bg-primitive-basic-red-40 px-16 py-8 text-noto-label-md-bold text-primitive-basic-red-500'>
          {badge}
        </span>
      )}

      <div className='flex h-fit w-full flex-col gap-xl'>
        <div className='flex h-fit w-full flex-col gap-12'>
          {/* 플랜 이름 ex. PRO */}
          <span className='text-ibm-title-lg-normal text-text-and-icon-default'>
            {planName}
          </span>

          {/* 가격 / 월
           * 글자 크기가 32px 대 14px로 크게 차이나므로 items-end(박스 아래 정렬)로는
           * 큰 쪽 디센더 공간만큼 작은 쪽 기준선이 7px 내려앉는다.
           * 한 줄로 읽혀야 하는 문구이므로 기준선을 맞춘다. */}
          <div className='flex size-fit items-baseline gap-4'>
            <h5 className='text-ibm-heading-lg-normal text-text-and-icon-default'>
              {price}
            </h5>
            {period && (
              <span className='text-noto-body-xs-bold text-text-and-icon-secondary'>
                / {period}
              </span>
            )}
          </div>
        </div>

        {/* 기능 설명 — 한 줄 안에서 조각별로 강조가 갈린다 */}
        <ul className='flex h-fit w-full flex-col gap-8'>
          {features.map((line, lineIdx) => (
            <li
              key={lineIdx}
              className='flex h-fit w-full items-center gap-6 text-noto-body-md-normal text-text-and-icon-default'>
              <IconCheck className='size-3.75 shrink-0 text-brand-primary' />
              <span>
                {line.map((segment, segmentIdx) => (
                  <span
                    key={segmentIdx}
                    className={
                      segment.emphasized ? 'text-brand-primary' : undefined
                    }>
                    {segment.text}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 결제 로직이 아직 없어 동작을 붙이지 않는다 */}
      <Button
        className='h-fit w-full gap-10 rounded-6 px-20 py-10'
        color={highlighted ? 'primary' : 'gray'}
        variant='filled'>
        {buttonLabel}
      </Button>
    </div>
  )
}
