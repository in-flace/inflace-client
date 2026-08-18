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
      className='w-full max-w-[32rem] bg-white [&>span]:size-16 sm:w-fit'
      onClick={open}>
      {children}
    </Button>
  )
}
