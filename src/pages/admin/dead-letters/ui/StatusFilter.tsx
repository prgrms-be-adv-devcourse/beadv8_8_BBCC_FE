import { cn } from '@/shared/lib'

type StatusFilterProps<T extends string> = {
  labels: Readonly<Record<T, string>>
  value: T
  onChange: (next: T) => void
}

/** 상태 고르기 버튼 묶음 (모듈 · 주문 목록이 같이 쓴다) */
export function StatusFilter<T extends string>({ labels, value, onChange }: StatusFilterProps<T>) {
  return (
    <div role="group" aria-label="상태" className="flex flex-wrap gap-2">
      {(Object.keys(labels) as T[]).map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            'border-rule inline-flex h-10 shrink-0 items-center rounded-md border px-4 text-sm font-semibold transition-colors max-lg:h-11',
            value === key ? 'border-ink text-ink' : 'text-ink-2 hover:border-field-edge',
          )}
        >
          {labels[key]}
        </button>
      ))}
    </div>
  )
}
