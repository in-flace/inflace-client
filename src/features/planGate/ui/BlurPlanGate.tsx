import Image from 'next/image'
import LockButton from '@/features/planGate/assets/lock-button.png'
import { type ReactNode } from 'react'
import { usePlanGate } from '@/features/planGate/model/usePlanGate'
import { Tooltip } from '@/shared/ui/tooltip'

interface BlurPlanGateProps {
  children: ReactNode
  // 플랜과 무관하게 항상 잠금 처리해야 하는 경우(예: 채널 미연동) 강제로 잠그기 위한 옵션
  forceLocked?: boolean
}

// PlanGate의 그라데이션 dim 대신 전체 영역을 균일하게 블러 처리하는 변형
// (예: 시청자 반응 급상승 동영상 섹션의 잠금 미리보기)
export function BlurPlanGate({
  children,
  forceLocked = false,
}: BlurPlanGateProps) {
  const { isLocked } = usePlanGate()

  if (!isLocked && !forceLocked) return <>{children}</>

  return (
    <div className='relative'>
      {children}

      {/* 전체 블러 + 반투명 오버레이 */}
      <div
        className={
          'pointer-events-none absolute inset-0 bg-white/95 backdrop-blur-[1.2rem]'
        }
      />

      {/* 락 UI: 자물쇠 호버 시 shadcn Tooltip으로 안내 노출 */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <Tooltip label='채널 연동 후 확인할 수 있어요'>
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
