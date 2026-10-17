import type { ReactNode } from 'react'

type DetailListProps = { items: { label: string; value: ReactNode }[] }

/** 서랍 안 "이름: 값" 목록 */
export function DetailList({ items }: DetailListProps) {
  return (
    <dl className="divide-y rounded-xl border text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex justify-between gap-4 px-3 py-2">
          <dt className="text-muted-foreground shrink-0">{item.label}</dt>
          <dd className="text-right">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
