import { pageNumbersOf } from '@/shared/api'
import { cn } from '@/shared/lib'

type PaginationProps = {
  /** 지금 페이지 (0부터) */
  page: number
  totalPages: number
  onChange: (page: number) => void
}

/** 목록 아래 페이지 번호 (사람이 보는 번호는 1부터). 한 페이지뿐이면 그리지 않는다 */
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null
  const buttonClass = 'flex size-9 items-center justify-center rounded-full text-sm'
  return (
    <nav aria-label="페이지" className="flex items-center justify-center gap-1">
      <button
        type="button"
        aria-label="이전 페이지"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className={cn(buttonClass, 'disabled:opacity-30')}
      >
        ‹
      </button>
      {pageNumbersOf(page, totalPages).map((number) => (
        <button
          key={number}
          type="button"
          aria-label={`${number + 1}페이지`}
          aria-current={number === page ? 'page' : undefined}
          onClick={() => onChange(number)}
          className={cn(
            buttonClass,
            number === page ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted',
          )}
        >
          {number + 1}
        </button>
      ))}
      <button
        type="button"
        aria-label="다음 페이지"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        className={cn(buttonClass, 'disabled:opacity-30')}
      >
        ›
      </button>
    </nav>
  )
}
