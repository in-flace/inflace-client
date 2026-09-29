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

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null

  const pages =
    totalPages <= 7
      ? Array.from({ length: totalPages }, (_, p) => p)
      : page < 4
        ? [0, 1, 2, 3, 4, 'end', totalPages - 1]
        : page >= totalPages - 4
          ? [0, 'start', ...Array.from({ length: 5 }, (_, i) => totalPages - 5 + i)]
          : [0, 'start', page - 1, page, page + 1, 'end', totalPages - 1]

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
      {pages.map((p) =>
        typeof p === 'number' ? (
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
        ) : (
          <span key={p} className={itemClass} aria-hidden='true'>
            …
          </span>
        )
      )}
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
