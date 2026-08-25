import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TabGroup } from './TabGroup'

const TABS = [
  { id: 'first', label: '첫 번째' },
  { id: 'second', label: '두 번째' },
] as const

describe('TabGroup', () => {
  it('기본 모드에서는 스크롤 전용 레이아웃을 적용하지 않는다', () => {
    render(
      <TabGroup tabs={TABS} activeTab='first' onTabChange={vi.fn()} />
    )

    const firstTab = screen.getByRole('button', { name: '첫 번째' })
    const tabList = firstTab.parentElement

    expect(tabList).not.toHaveClass('overflow-x-auto', 'max-w-full')
    expect(firstTab).not.toHaveClass('min-w-[14rem]', 'shrink-0')
    expect(firstTab).toHaveClass('text-noto-label-lg-bold')
  })

  it('scrollable 모드에서 가로 스크롤과 탭 최소 너비를 적용한다', () => {
    render(
      <TabGroup
        tabs={TABS}
        activeTab='first'
        onTabChange={vi.fn()}
        scrollable
      />
    )

    const firstTab = screen.getByRole('button', { name: '첫 번째' })
    const tabList = firstTab.parentElement

    expect(tabList).toHaveClass('overflow-x-auto', 'max-w-full')
    expect(firstTab).toHaveClass(
      'min-w-[14rem]',
      'shrink-0',
      'text-noto-label-md-bold',
      'sm:text-noto-label-lg-bold'
    )
  })

  it('탭을 클릭하면 선택한 탭 id를 전달한다', async () => {
    const user = userEvent.setup()
    const handleTabChange = vi.fn()

    render(
      <TabGroup
        tabs={TABS}
        activeTab='first'
        onTabChange={handleTabChange}
      />
    )

    await user.click(screen.getByRole('button', { name: '두 번째' }))

    expect(handleTabChange).toHaveBeenCalledWith('second')
  })
})
