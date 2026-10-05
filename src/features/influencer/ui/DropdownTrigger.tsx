import { useState, useRef, useEffect } from 'react'

import { cn } from '@/shared/lib/utils'
import IconDown from '@/shared/assets/down-bold.svg'
import IconX from '@/shared/assets/x-bold.svg'

type DropdownTriggerProps = {
  label: string
  output: string
  /** 현재 값이 기본값과 다른지 여부 — true면 brand-secondary 배경 + X(초기화) 버튼 노출 */
  isModified?: boolean
  /** X 클릭 시 필터를 기본값으로 초기화 */
  onReset?: () => void
  children?: (onClose: () => void) => React.ReactNode
}

function DropdownTrigger({
  label,
  output,
  isModified = false,
  onReset,
  children,
}: DropdownTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className='relative'>
      {/* 패딩은 안쪽 버튼이 갖고 버튼들이 칩 높이를 꽉 채운다(stretch)
       * — 칩 전체가 버튼 영역이어야 커서가 일관되게 pointer로 유지됨 */}
      <div
        className={cn(
          'flex size-fit shrink-0 rounded-10 bg-white',
          isModified && 'bg-brand-secondary'
        )}>
        <button
          type='button'
          onClick={() => children && setIsOpen((prev) => !prev)}
          className='flex cursor-pointer items-center gap-12 p-12'>
          {/* 필터링 기준 */}
          <span
            className={cn(
              'shrink-0 text-noto-label-sm-bold whitespace-nowrap text-text-and-icon-primary',
              isModified && 'text-white'
            )}>
            {label}:
          </span>
          {/* 결과값 */}
          <span
            className={cn(
              'max-w-[8rem] truncate text-noto-label-sm-normal whitespace-nowrap text-text-and-icon-tertiary',
              isModified && 'text-white'
            )}>
            {output}
          </span>
          {/* 기본값 상태: 아래 화살표
           * 래퍼 크기를 고정해야 한다 — 크기 없는 부모에 svg를 100%로 두면
           * Safari가 퍼센트를 해석하지 못해 아이콘이 칩 전체로 부풀어 오른다 */}
          {!isModified && (
            <span className='flex size-16 shrink-0 items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>svg_*]:fill-current'>
              <IconDown />
            </span>
          )}
        </button>
        {/* 기본값과 다른 상태: X 클릭 시 기본값으로 초기화 */}
        {isModified && (
          <button
            type='button'
            aria-label={`${label} 초기화`}
            onClick={() => {
              onReset?.()
              setIsOpen(false)
            }}
            className='flex shrink-0 cursor-pointer items-center justify-center py-12 pr-12 text-white'>
            {/* 화살표와 같은 이유로 래퍼 크기를 고정한다 */}
            <span className='flex size-16 items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>svg_*]:fill-current'>
              <IconX />
            </span>
          </button>
        )}
      </div>

      {isOpen && children && (
        <div className='absolute top-full left-0 z-10 mt-8'>
          {children(() => setIsOpen(false))}
        </div>
      )}
    </div>
  )
}

export { DropdownTrigger }
