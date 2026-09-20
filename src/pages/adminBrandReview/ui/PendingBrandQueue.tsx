'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import {
  useApproveBrands,
  usePendingBrands,
  useRejectBrands,
  type ApproveBrandsRequest,
} from '@/features/admin'
import {
  PendingBrandCard,
  type PendingBrandEdit,
} from '@/widgets/adminBrandReview'
import { ListFooter } from './ListFooter'

const PAGE_SIZE = 5

export function PendingBrandQueue() {
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [edits, setEdits] = useState<Record<number, PendingBrandEdit>>({})

  const { data } = usePendingBrands({ page, size: PAGE_SIZE })
  const approve = useApproveBrands()
  const reject = useRejectBrands()

  const brands = data?.pendingBrands.content ?? []
  const totalPages = data?.pendingBrands.totalPages ?? 0
  const allSelected =
    brands.length > 0 && brands.every((b) => selected.has(b.id))
  const busy = approve.isPending || reject.isPending

  function toggle(id: number, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleAll(on: boolean) {
    setSelected(on ? new Set(brands.map((b) => b.id)) : new Set())
  }

  function clearSelection() {
    setSelected(new Set())
  }

  function handleApprove() {
    const brandIds = [...selected]
    const body: ApproveBrandsRequest = {
      brandIds,
      brandNames: {},
      targetBrandIds: {},
    }
    // 입력한 것만 보낸다 — 원래 이름 그대로면 굳이 덮어쓸 필요 없음
    for (const id of brandIds) {
      const edit = edits[id]
      const original = brands.find((b) => b.id === id)
      if (edit?.name && edit.name !== original?.name)
        body.brandNames[id] = edit.name
      if (edit?.targetBrandId)
        body.targetBrandIds[id] = Number(edit.targetBrandId)
    }
    approve.mutate(body, { onSuccess: clearSelection })
  }

  function handleReject() {
    reject.mutate([...selected], { onSuccess: clearSelection })
  }

  return (
    <>
      <div className='flex items-center justify-between rounded-16 bg-white px-24 py-16'>
        <label className='flex items-center gap-8 text-noto-label-sm-bold text-text-and-icon-secondary'>
          <input
            type='checkbox'
            checked={allSelected}
            onChange={(e) => toggleAll(e.target.checked)}
            className='size-16 accent-brand-primary'
          />
          전체 선택
        </label>
        <div className='flex gap-8'>
          <Button
            size='sm'
            color='primary'
            disabled={busy || selected.size === 0}
            onClick={handleApprove}>
            선택 항목 일괄 승인 ({selected.size})
          </Button>
          <Button
            size='sm'
            color='gray'
            disabled={busy || selected.size === 0}
            onClick={handleReject}>
            선택 항목 일괄 거절
          </Button>
        </div>
      </div>

      {brands.length === 0 && (
        <div className='rounded-16 bg-white p-40 text-center text-noto-body-xs-normal text-text-and-icon-secondary'>
          검수 대기 중인 브랜드가 없습니다.
        </div>
      )}
      {brands.map((brand) => (
        <PendingBrandCard
          key={brand.id}
          brand={brand}
          selected={selected.has(brand.id)}
          edit={edits[brand.id] ?? { name: brand.name, targetBrandId: '' }}
          onSelect={(on) => toggle(brand.id, on)}
          onEdit={(edit) => setEdits((prev) => ({ ...prev, [brand.id]: edit }))}
        />
      ))}

      <ListFooter
        total={data?.pendingBrands.totalElements}
        shown={brands.length}
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => {
          setPage(p)
          clearSelection()
        }}
      />
    </>
  )
}
