import { formatDateTime } from '@/shared/lib'
import type { OrderHistoryEntry } from '../model/order-history'

type OrderHistoryListProps = {
  entries: readonly OrderHistoryEntry[]
}

/** 상태 이력: 오래된 것부터 시각 · 대상 · 바뀐 상태 · 누가 · 어디서 · 사유 */
export function OrderHistoryList({ entries }: OrderHistoryListProps) {
  if (entries.length === 0)
    return (
      <p className="bg-paper-2 text-ink-2 rounded-lg px-4 py-8 text-center text-sm">
        아직 기록된 상태 변화가 없어요.
      </p>
    )
  return (
    <ol aria-label="상태 이력 목록" className="divide-rule border-rule divide-y border-y">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="grid gap-x-4 gap-y-1 py-3 text-sm sm:grid-cols-[9.5rem_minmax(0,1fr)]"
        >
          <span className="figure text-ink-3">{formatDateTime(entry.occurredAt)}</span>
          <div className="space-y-0.5">
            <p>
              <span className="text-ink-3 mr-2">{`${entry.target} ${entry.targetId}`}</span>
              {entry.from && <span className="text-ink-2">{entry.from} → </span>}
              <span className="font-semibold">{entry.to}</span>
            </p>
            <p className="text-ink-2 text-[13px]">
              {entry.actor} · {entry.source}
            </p>
            {entry.reason && <p className="text-ink-2 text-[13px]">사유: {entry.reason}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
