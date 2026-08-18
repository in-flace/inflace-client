'use client'

import { Button } from '@/shared/ui/button'
import { useLoginModal } from '@/features/auth'
import IconArrowRight from '@/shared/assets/rightwards-arrow-bold.svg'

export function HeroCtaButton({ children }: { children: React.ReactNode }) {
  const open = useLoginModal((s) => s.open)
  return (
    <Button
      color='secondary'
      size='lg'
      variant='outlined'
      rightIcon={<IconArrowRight />}
      className='bg-white'
      onClick={() => open('hero_cta')}>
      {children}
    </Button>
  )
}
