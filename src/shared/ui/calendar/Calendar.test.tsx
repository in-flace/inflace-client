import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { Calendar } from './Calendar'

describe('Calendar', () => {
  describe('렌더링', () => {
    it('정상 렌더링된다', () => {
      render(<Calendar />)
      expect(
        document.querySelector('[data-slot="calendar"]')
      ).toBeInTheDocument()
    })

    it('onConfirm 미전달 시 완료 버튼이 없다', () => {
      render(<Calendar />)
      expect(
        screen.queryByRole('button', { name: '완료' })
      ).not.toBeInTheDocument()
    })

    it('onConfirm 전달 시 완료 버튼이 표시된다', () => {
      render(<Calendar onConfirm={() => {}} />)
      expect(screen.getByRole('button', { name: '완료' })).toBeInTheDocument()
    })

    it('confirmDisabled=true 시 완료 버튼이 비활성화된다', () => {
      render(<Calendar onConfirm={() => {}} confirmDisabled />)
      expect(screen.getByRole('button', { name: '완료' })).toBeDisabled()
    })

    it('confirmDisabled=false 시 완료 버튼이 활성화된다', () => {
      render(<Calendar onConfirm={() => {}} confirmDisabled={false} />)
      expect(screen.getByRole('button', { name: '완료' })).toBeEnabled()
    })
  })

  describe('상호작용', () => {
    /* mode가 range가 아니면 "범위를 다 골라야 확정 가능" 규칙이 적용되지 않으므로
     * 완료 버튼은 처음부터 활성이다. 이전에는 mode와 무관하게 그 규칙이 걸려
     * 여기서 버튼이 비활성인 채로 클릭돼 호출 0회가 나왔다. */
    it('완료 버튼 클릭 시 onConfirm이 호출된다', async () => {
      const handleConfirm = vi.fn()
      render(<Calendar onConfirm={handleConfirm} />)
      await userEvent.click(screen.getByRole('button', { name: '완료' }))
      expect(handleConfirm).toHaveBeenCalledTimes(1)
    })
  })

  describe('DualCalendar (numberOfMonths=2)', () => {
    it('정상 렌더링된다', () => {
      render(<Calendar numberOfMonths={2} />)
      expect(
        document.querySelector('[data-slot="calendar"]')
      ).toBeInTheDocument()
    })

    it('onConfirm 미전달 시 완료 버튼이 없다', () => {
      render(<Calendar numberOfMonths={2} />)
      expect(
        screen.queryByRole('button', { name: '완료' })
      ).not.toBeInTheDocument()
    })

    it('onConfirm 전달 시 완료 버튼이 표시된다', () => {
      render(<Calendar numberOfMonths={2} onConfirm={() => {}} />)
      expect(screen.getByRole('button', { name: '완료' })).toBeInTheDocument()
    })

    it('range 미선택 시 완료 버튼이 비활성화된다', () => {
      render(<Calendar mode='range' numberOfMonths={2} onConfirm={() => {}} />)
      expect(screen.getByRole('button', { name: '완료' })).toBeDisabled()
    })

    it('완료 버튼 클릭 시 onConfirm이 호출된다', async () => {
      const handleConfirm = vi.fn()
      render(
        <Calendar
          mode='range'
          numberOfMonths={2}
          onConfirm={handleConfirm}
          confirmDisabled={false}
        />
      )
      await userEvent.click(screen.getByRole('button', { name: '완료' }))
      expect(handleConfirm).toHaveBeenCalledTimes(1)
    })
  })
})
