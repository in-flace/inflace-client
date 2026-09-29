import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('페이지가 많아도 현재 페이지 주변만 렌더링한다', () => {
    render(<Pagination page={100} totalPages={206} onChange={vi.fn()} />)

    expect(screen.getAllByRole('button')).toHaveLength(7)
    expect(screen.getByRole('button', { name: '101' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.queryByRole('button', { name: '50' })).not.toBeInTheDocument()
  })
})
