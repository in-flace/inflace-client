import { PLANS_CARD_ITEM, PlansCard } from '@/entities/home/plansCard'

import { PlanStartButton } from './PlanStartButton'

export function PlansSection() {
  return (
    <>
      <div className='text-center'>
        <h3 className='text-ibm-heading-sm-normal text-text-and-icon-default'>
          인플레이스 플랜 안내
        </h3>
        <p className='text-noto-body-xs-normal text-text-and-icon-tertiary'>
          회원가입만 하면 무료로 시작! 플랜 변경은 언제든 가능해요.
        </p>
      </div>

      {/* 배지가 카드 위로 걸치므로 위쪽 여백을 둔다. 없으면 제목과 겹친다. */}
      <div className='mt-2xl grid grid-cols-1 gap-md md:grid-cols-2'>
        {PLANS_CARD_ITEM.map((item) => (
          <PlansCard
            key={item.planName}
            {...item}
            action={
              <PlanStartButton highlighted={item.highlighted}>
                {item.buttonLabel}
              </PlanStartButton>
            }
          />
        ))}
      </div>
    </>
  )
}
