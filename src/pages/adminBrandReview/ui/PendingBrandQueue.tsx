'use client'

import { useState } from 'react'
import { toast } from 'sonner'
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
  // 근거 영상 관계(channelBrandId) 단위 선택 — 브랜드 선택은 여기서 파생한다
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [edits, setEdits] = useState<Record<number, PendingBrandEdit>>({})

  const { data } = usePendingBrands({ page, size: PAGE_SIZE })
  const approve = useApproveBrands()
  const reject = useRejectBrands()

  const brands = data?.pendingBrands.content ?? []
  const totalPages = data?.pendingBrands.totalPages ?? 0
  const allIds = brands.flatMap((b) =>
    b.videoEvidence.map((e) => e.channelBrandId)
  )
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id))
  // 서버는 brandIds와 선택 영상이 속한 브랜드 집합이 정확히 같아야 하므로 선택에서 계산한다
  const selectedBrands = brands.filter((b) =>
    b.videoEvidence.some((e) => selected.has(e.channelBrandId))
  )
  const busy = approve.isPending || reject.isPending

  function toggle(ids: number[], on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (on) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  function toggleAll(on: boolean) {
    setSelected(on ? new Set(allIds) : new Set())
  }

  function clearSelection() {
    setSelected(new Set())
  }

  function handleApprove() {
    const body: ApproveBrandsRequest = {
      brandIds: selectedBrands.map((b) => b.id),
      channelBrandIds: [...selected],
      brandNames: {},
      targetBrandIds: {},
    }
    for (const brand of selectedBrands) {
      const edit = edits[brand.id]
      if (edit?.targetBrandId) {
        // 병합이면 서버가 이름을 쓰지 않는다
        body.targetBrandIds[brand.id] = Number(edit.targetBrandId)
        continue
      }
      const name = (edit?.name ?? brand.name).trim()
      if (!name) {
        toast.error(`Brand ID ${brand.id}의 승인 이름을 입력해주세요.`)
        return
      }
      body.brandNames[brand.id] = name
    }

    /* 승인되면 브랜드가 대기 큐(PENDING)에서 빠져서, 선택하지 않은 영상은
     * 미승인으로 남은 채 다시 검수할 수 없다 */
    const skipped = selectedBrands.reduce(
      (sum, b) =>
        sum + b.videoEvidence.filter((e) => !selected.has(e.channelBrandId)).length,
      0
    )
    if (
      skipped > 0 &&
      !window.confirm(
        `선택하지 않은 영상 ${skipped}개는 승인되지 않으며 다시 검수할 수 없습니다. 계속할까요?`
      )
    )
      return
    approve.mutate(body, { onSuccess: clearSelection })
  }

  function handleReject() {
    // 반려된 브랜드는 서버에서 다시 승인할 수 없다(PENDING만 검수 가능)
    if (
      !window.confirm(
        `${selectedBrands.length}개 브랜드를 반려합니다. 되돌릴 수 없습니다.`
      )
    )
      return
    reject.mutate(
      selectedBrands.map((b) => b.id),
      { onSuccess: clearSelection }
    )
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
            선택 항목 일괄 승인 ({selectedBrands.length})
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
          selectedIds={selected}
          edit={edits[brand.id] ?? { name: brand.name, targetBrandId: '' }}
          onSelect={toggle}
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
