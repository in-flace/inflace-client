import Image from 'next/image'
import LockButton from '../assets/lock-button.png'
import { type ReactNode } from 'react'

import { usePlanGate } from '../model/usePlanGate'
import { Tooltip } from '@/shared/ui/tooltip'

interface PlanGateProps {
  children: ReactNode
}

export function PlanGate({ children }: PlanGateProps) {
  const { isLocked } = usePlanGate()

  if (!isLocked) return <>{children}</>

  return (
    <div className='relative'>
      {children}

      {/* 그라데이션 오버레이 */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          background:
            'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, #FFFFFF 49.68%)',
        }}
      />

      {/* 락 UI: 자물쇠 호버 시 shadcn Tooltip으로 안내 노출 */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <Tooltip
          label='PRO플랜으로 업그레이드 하세요'
          side='bottom'>
          <button
            type='button'
            aria-label='잠금 안내 보기'
            className='inline-flex items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none'>
            <Image src={LockButton} alt='' width={32} height={32} aria-hidden />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
