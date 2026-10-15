import type { StateChange } from '../model/state-changes'

type ChangeListProps = { changes: StateChange[] }

export function ChangeList({ changes }: ChangeListProps) {
  const visible = changes.filter((change) => change.from !== null)
  if (visible.length === 0) {
    return (
      <p className="text-muted-foreground p-2 text-xs">
        응답으로 확인한 서버 상태가 바뀌면 여기에 쌓여요. 예: 주문 PENDING_PAYMENT → PAID (서버
        이벤트 처리 시간)
      </p>
    )
  }
  return (
    <ol className="space-y-1">
      {[...visible].reverse().map((change) => (
        <li
          key={`${change.logId}-${change.resource}`}
          className="rounded-md border px-2 py-1.5 text-xs"
        >
          <div className="flex justify-between">
            <span className="font-medium">{change.resource}</span>
            <span className="text-muted-foreground">{change.at.slice(11, 19)}</span>
          </div>
          <div className="font-mono">
            <span className="text-muted-foreground">{change.from}</span> →{' '}
            <span className="text-primary font-semibold">{change.to}</span>
            {change.elapsedMs !== null && (
              <span className="text-muted-foreground">
                {' '}
                · {(change.elapsedMs / 1000).toFixed(1)}초
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
