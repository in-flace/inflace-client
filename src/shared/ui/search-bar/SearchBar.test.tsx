import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

import { SearchBar } from './SearchBar'

/* SearchBar는 controlled 전용이다(types.ts 참고).
 * 이전 테스트 4건은 defaultValue만 넘기는 uncontrolled 사용을 가정해 실패했는데,
 * 컴포넌트가 그 모드를 지원한 적이 없고 실사용 두 곳도 모두 controlled다.
 * 이제 타입이 그 사용법을 막으므로, 테스트도 상태를 쥔 쪽에서 값을 넣어준다. */
function ControlledSearchBar({ initialValue = '' }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue)

  return (
    <SearchBar
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onClear={() => setValue('')}
    />
  )
}

describe('SearchBar', () => {
  describe('렌더링', () => {
    it('input이 정상 렌더링된다', () => {
      render(<ControlledSearchBar />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('value가 비어 있으면 X 버튼이 표시되지 않는다', () => {
      render(<ControlledSearchBar />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('value가 있으면 X 버튼이 표시된다', () => {
      render(<ControlledSearchBar initialValue='검색어' />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('입력', () => {
    it('텍스트 입력 시 X 버튼이 나타난다', async () => {
      render(<ControlledSearchBar />)
      await userEvent.type(screen.getByRole('textbox'), '검색어')
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('onChange prop이 입력 시 호출된다', async () => {
      const handleChange = vi.fn()
      render(<SearchBar value='' onChange={handleChange} />)
      await userEvent.type(screen.getByRole('textbox'), 'a')
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('X 버튼', () => {
    it('X 버튼 클릭 시 input 값이 초기화된다', async () => {
      render(<ControlledSearchBar initialValue='검색어' />)
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('X 버튼 클릭 후 X 버튼이 사라진다', async () => {
      render(<ControlledSearchBar initialValue='검색어' />)
      await userEvent.click(screen.getByRole('button'))
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('focus', () => {
    it('input이 focus 가능하다', async () => {
      render(<ControlledSearchBar />)
      const input = screen.getByRole('textbox')
      await userEvent.click(input)
      expect(input).toHaveFocus()
    })
  })
})
