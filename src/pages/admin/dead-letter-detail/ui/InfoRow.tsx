import type { ReactNode } from 'react'

type InfoRowProps = { label: string; children: ReactNode }

/** 상세 정보 한 줄 (이름 · 값) */
export function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="flex min-h-14 items-center gap-4 px-5 py-3">
      <dt className="text-ink-3 w-24 shrink-0 text-sm">{label}</dt>
      <dd className="text-ink min-w-0 flex-1 text-sm font-semibold break-all">{children}</dd>
    </div>
  )
}
