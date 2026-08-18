import { PLANS_CARD_ITEM, PlansCard } from '@/entities/home/plansCard'

export function PlansSection() {
  return (
    <>
      <div className='text-center'>
        <h3 className='text-ibm-heading-sm-normal text-text-and-icon-default'>
          지금 무료로 시작하세요
        </h3>
        <p className='text-noto-body-xs-normal text-text-and-icon-tertiary'>
          플랜은 언제든지 변경 가능합니다
        </p>
      </div>

      {/* 배지가 카드 위로 걸치므로 위쪽 여백을 둔다. 없으면 제목과 겹친다. */}
      <div className='mt-2xl grid grid-cols-1 gap-md md:grid-cols-2'>
        {PLANS_CARD_ITEM.map((item) => (
          <PlansCard key={item.planName} {...item} />
        ))}
      </div>
    </>
  )
}
