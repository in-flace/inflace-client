'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { SearchBar } from '@/shared/ui/search-bar'
import { useBrands } from '@/features/admin'
import { BrandTable } from '@/widgets/adminBrandReview'
import { ListFooter } from './ListFooter'

const PAGE_SIZE = 10

export function BrandHistory() {
  const [input, setInput] = useState('')
  // Figma대로 "검색" 버튼을 눌러야 조회 — 타이핑마다 요청 안 나감
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const { data } = useBrands({
    query: query || undefined,
    page,
    size: PAGE_SIZE,
  })
  const brands = data?.brands.content ?? []

  function search() {
    setQuery(input.trim())
    setPage(0)
  }
  function reset() {
    setInput('')
    setQuery('')
    setPage(0)
  }

  return (
    <>
      <form
        className='flex items-end gap-16 rounded-16 bg-white p-24'
        onSubmit={(e) => {
          e.preventDefault()
          search()
        }}>
        <label className='flex w-full flex-col gap-8'>
          <span className='text-noto-label-sm-bold text-text-and-icon-secondary'>
            브랜드 이름 또는 ID
          </span>
          <SearchBar
            placeholder='브랜드 이름 또는 ID'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onClear={reset}
          />
        </label>
        <Button type='submit' size='md' color='primary' className='shrink-0'>
          검색
        </Button>
        <Button
          type='button'
          size='md'
          color='gray'
          className='shrink-0'
          onClick={reset}>
          초기화
        </Button>
      </form>

      <section className='rounded-16 bg-white p-24'>
        <BrandTable brands={brands} />
      </section>

      <ListFooter
        total={data?.brands.totalElements}
        shown={brands.length}
        page={page}
        totalPages={data?.brands.totalPages ?? 0}
        onPageChange={setPage}
      />
    </>
  )
}
