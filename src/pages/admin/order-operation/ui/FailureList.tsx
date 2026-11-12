import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

type FailureListProps = {
  /** 「처리 대기만」 고르기. 없으면 고르기를 그리지 않는다 */
  pendingOnly?: { value: boolean; onChange: (value: boolean) => void }
  total: number | null
  emptyText: string
  children: ReactNode
  isEmpty: boolean
}

/** 처리 대기 탭 공통: 처리 대기만 / 전체 고르기 · 건수 · 빈 목록 문구 */
export function FailureList({
  pendingOnly,
  total,
  emptyText,
  children,
  isEmpty,
}: FailureListProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-ink-2 mr-auto text-sm">
          {total !== null && <span className="figure font-semibold">{total}건</span>}
        </p>
        {pendingOnly && (
          <div role="group" aria-label="상태" className="flex gap-2">
            {[
              { value: true, label: '처리 대기만' },
              { value: false, label: '전체' },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={pendingOnly.value === option.value}
                onClick={() => pendingOnly.onChange(option.value)}
                className={cn(
                  'border-rule inline-flex h-10 items-center rounded-md border px-3 text-sm',
                  pendingOnly.value === option.value
                    ? 'border-ink text-ink font-semibold'
                    : 'text-ink-2',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {isEmpty ? (
        <p className="bg-paper-2 text-ink-2 rounded-lg py-12 text-center text-sm">{emptyText}</p>
      ) : (
        <ul className="space-y-3">{children}</ul>
      )}
    </section>
  )
}
