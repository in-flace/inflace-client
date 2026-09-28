import { Pagination } from '@/shared/ui/pagination'
import { formatComma } from '@/shared/lib/format'

// 두 탭이 공유하는 하단 바: "N 건 · M 건 표시" + 페이지네이션
export function ListFooter({
  total,
  shown,
  page,
  totalPages,
  onPageChange,
}: {
  total: number | undefined
  shown: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className='flex items-center justify-between'>
      <span className='text-noto-label-xs-normal text-text-and-icon-secondary'>
        {formatComma(total)} 건 · {shown} 건 표시
      </span>
      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </div>
  )
}
