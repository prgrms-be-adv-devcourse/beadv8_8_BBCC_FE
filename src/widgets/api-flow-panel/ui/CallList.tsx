import { useEffect, useRef, useState } from 'react'
import type { ApiCallLog } from '@/shared/api'
import { cn } from '@/shared/lib'
import { groupCallsByStep, type CallGroup } from '../model/call-groups'
import { statusColor } from '../model/status-color'

type CallListProps = {
  logs: ApiCallLog[]
  /** 고른 호출 (상세가 옆에 보인다) */
  selectedLogId: number | null
  /** 줄을 누름: 고른 호출이면 닫고, 아니면 고른다 */
  onSelect: (logId: number) => void
}

/** 호출을 시연 단계별로 묶어 최신 묶음부터. 한 줄에 메서드 · 경로 · 상태 · 시간만, 상세는 옆에 */
export function CallList({ logs, selectedLogId, onSelect }: CallListProps) {
  if (logs.length === 0) {
    return (
      <p className="text-muted-foreground p-2 text-xs">
        화면을 조작하면 호출한 API가 여기에 단계별로 쌓여요.
      </p>
    )
  }
  const groups = groupCallsByStep(logs)
  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <CallGroupSection
          key={`${group.step}-${group.logs[0].id}`}
          group={group}
          selectedLogId={selectedLogId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

type CallGroupSectionProps = {
  group: CallGroup
  selectedLogId: number | null
  onSelect: (logId: number) => void
}

function CallGroupSection({ group, selectedLogId, onSelect }: CallGroupSectionProps) {
  const hasSelected = group.logs.some((log) => log.id === selectedLogId)
  const [toggled, setToggled] = useState<boolean | null>(null)
  // 목록을 길게 보도록 모두 펼쳐 두고, 접은 묶음도 고른 호출이 있으면 펼친다
  const open = hasSelected || (toggled ?? true)
  return (
    <section aria-label={`단계 ${group.step} 호출`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setToggled(!open)}
        className="hover:bg-muted/50 flex w-full items-center gap-2 rounded px-1 py-1 text-left text-xs"
      >
        <span aria-hidden className="text-muted-foreground w-3">
          {open ? '▾' : '▸'}
        </span>
        <span className="font-bold">{group.step}</span>
        <span className="text-muted-foreground min-w-0 flex-1 truncate">
          {group.actions.slice(0, 3).join(' · ')}
        </span>
        <span className="text-muted-foreground shrink-0">
          {group.logs.length}
          {group.failed > 0 && <span className="text-destructive"> · 실패 {group.failed}</span>}
        </span>
      </button>
      {open && (
        <ol className="space-y-1 pt-1">
          {[...group.logs].reverse().map((log) => (
            <ApiCallRow
              key={log.id}
              log={log}
              selected={log.id === selectedLogId}
              onSelect={onSelect}
            />
          ))}
        </ol>
      )}
    </section>
  )
}

type ApiCallRowProps = { log: ApiCallLog; selected: boolean; onSelect: (logId: number) => void }

function ApiCallRow({ log, selected, onSelect }: ApiCallRowProps) {
  const ref = useRef<HTMLLIElement>(null)
  const contractError = log.contractIssues.some((issue) => issue.type !== 'extra')
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selected])

  return (
    <li ref={ref}>
      <button
        type="button"
        aria-pressed={selected}
        title={[log.action, log.actor ? `회원 ${log.actor}` : '토큰 없음']
          .filter(Boolean)
          .join(' · ')}
        onClick={() => onSelect(log.id)}
        className={cn(
          'flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs',
          selected ? 'border-primary bg-primary-soft/60 ring-primary ring-1' : 'hover:bg-muted/50',
          contractError && !selected && 'border-destructive/50',
        )}
      >
        <span className="w-11 shrink-0 font-mono font-semibold">{log.method}</span>
        <span className="min-w-0 flex-1 truncate font-mono">{log.path}</span>
        {log.mock && <span className="bg-highlight rounded px-1">목</span>}
        {log.expectedReason && (
          <span className="bg-muted text-muted-foreground rounded px-1">예상됨</span>
        )}
        {contractError && (
          <span className="bg-destructive/10 text-destructive rounded px-1">계약 불일치</span>
        )}
        <span
          className={cn(
            'w-8 text-right font-mono font-semibold',
            log.expectedReason ? 'text-muted-foreground' : statusColor(log.status),
          )}
        >
          {log.status ?? '실패'}
        </span>
        <span className="text-muted-foreground w-11 text-right">{log.durationMs}ms</span>
      </button>
    </li>
  )
}
