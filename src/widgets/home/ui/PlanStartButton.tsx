'use client'

import { Button } from '@/shared/ui/button'
import { useLoginModal } from '@/features/auth'

/* 요금제 카드의 CTA.
 * 결제 플로우가 아직 없으므로 회원가입(구글 로그인 모달)으로 보낸다.
 *
 * 이 버튼을 카드(entities) 안에 두지 않는 이유는 레이어 때문이다.
 * entities가 features의 useLoginModal을 직접 import하면 방향 위반이 되고,
 * 그건 이미 알려진 위반(#16)을 넓히는 셈이다. 클릭 로직을 가진 조각만
 * widgets에 두고 카드에는 슬롯으로 넘긴다. HeroCtaButton과 같은 방식이다. */
export function PlanStartButton({
  children,
  highlighted = false,
}: {
  children: React.ReactNode
  highlighted?: boolean
}) {
  const open = useLoginModal((s) => s.open)

  return (
    <Button
      className='h-fit w-full gap-10 rounded-6 px-20 py-10'
      color={highlighted ? 'primary' : 'gray'}
      variant='filled'
      onClick={() => open('plan_card')}>
      {children}
    </Button>
  )
}
