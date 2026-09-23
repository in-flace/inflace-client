import { cn } from '@/shared/lib/utils'

type Props = {
  /** 0-based (Spring Page.number와 동일) */
  page: number
  totalPages: number
  onChange: (page: number) => void
}

const itemClass =
  'flex size-32 items-center justify-center rounded-8 border text-noto-label-sm-normal disabled:opacity-40'
const idleClass = 'border-stroke-border-gray-stronger bg-white'

// ponytail: 페이지 번호를 전부 나열한다. 페이지가 수십 개를 넘으면 앞뒤 생략(…) 추가
export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label='페이지' className='flex gap-4'>
      <button
        type='button'
        aria-label='이전 페이지'
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className={cn(itemClass, idleClass)}>
        ‹
      </button>
      {Array.from({ length: totalPages }, (_, p) => (
        <button
          key={p}
          type='button'
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onChange(p)}
          className={cn(
            itemClass,
            p === page
              ? 'border-brand-primary bg-brand-primary text-text-and-icon-inverse'
              : idleClass
          )}>
          {p + 1}
        </button>
      ))}
      <button
        type='button'
        aria-label='다음 페이지'
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        className={cn(itemClass, idleClass)}>
        ›
      </button>
    </nav>
  )
}
