import { useMemo, useState, type ReactNode } from 'react'
import { useApiFlowLog, useMockSettings, type ApiCallLog } from '@/shared/api'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import type { DomainId, FlowStep } from '../config/domain-flow'
import { buildReport, downloadText } from '../lib/report'
import { followingSteps, latestActionDomains } from '../model/flow-view'
import { deriveStateChanges, type StateChange } from '../model/state-changes'
import { DomainFlowMap } from './DomainFlowMap'

type Tab = 'calls' | 'changes' | 'contract' | 'mock'

/** 화면에서 일어난 API 호출, 그 뒤 서버에서 이어지는 처리, 서버 상태 변화, 계약 불일치를 보여 준다 */
export function ApiFlowPanel() {
  const logs = useApiFlowLog((state) => state.logs)
  const clear = useApiFlowLog((state) => state.clear)
  const [tab, setTab] = useState<Tab>('calls')
  const { called, followed } = latestActionDomains(logs)
  const changes = useMemo(() => deriveStateChanges(logs), [logs])
  const contractLogs = logs.filter((log) => log.contractIssues.length > 0)
  // 백엔드가 필드를 더한 것(extra)은 깨지지 않으므로 따로 센다
  const contractErrorCount = logs.filter((log) =>
    log.contractIssues.some((issue) => issue.type !== 'extra'),
  ).length
  const failedCount = logs.filter((log) => log.status === null || log.status >= 400).length

  const exportReport = () => {
    const report = buildReport(logs, changes)
    void navigator.clipboard?.writeText(report).catch(() => undefined)
    downloadText(
      `kidly-확인기록-${new Date().toISOString().slice(0, 16).replace(':', '')}.md`,
      report,
    )
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-l bg-white">
      <div className="space-y-2 border-b p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">도메인 흐름</h2>
          <span className="text-muted-foreground text-[11px]">■ 호출 □ 서버 이벤트로 이어짐</span>
        </div>
        <DomainFlowMap called={called} followed={followed} />
      </div>
      <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5 text-xs">
        <TabButton active={tab === 'calls'} onClick={() => setTab('calls')}>
          호출 {logs.length}
          {failedCount > 0 && <span className="text-destructive"> · 실패 {failedCount}</span>}
        </TabButton>
        <TabButton active={tab === 'changes'} onClick={() => setTab('changes')}>
          상태 변화 {changes.filter((change) => change.from !== null).length}
        </TabButton>
        <TabButton active={tab === 'contract'} onClick={() => setTab('contract')}>
          <span className={cn(contractErrorCount > 0 && 'text-destructive')}>
            계약 {contractErrorCount}
            {contractLogs.length > contractErrorCount &&
              ` (+추가 ${contractLogs.length - contractErrorCount})`}
          </span>
        </TabButton>
        <TabButton active={tab === 'mock'} onClick={() => setTab('mock')}>
          목 설정
        </TabButton>
        <div className="ml-auto flex gap-1">
          <Button size="xs" variant="ghost" onClick={exportReport} disabled={logs.length === 0}>
            기록 내보내기
          </Button>
          <Button size="xs" variant="ghost" onClick={clear}>
            지우기
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {tab === 'calls' && <CallList logs={logs} />}
        {tab === 'changes' && <ChangeList changes={changes} />}
        {tab === 'contract' && <ContractList logs={contractLogs} />}
        {tab === 'mock' && <MockSettings />}
      </div>
    </aside>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded px-2 py-1',
        active ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}

function CallList({ logs }: { logs: ApiCallLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="text-muted-foreground p-2 text-xs">
        화면을 조작하면 호출한 API가 여기에 순서대로 쌓여요.
      </p>
    )
  }
  return (
    <ol className="space-y-1">
      {[...logs].reverse().map((log) => (
        <ApiCallRow key={log.id} log={log} />
      ))}
    </ol>
  )
}

function ApiCallRow({ log }: { log: ApiCallLog }) {
  const [open, setOpen] = useState(false)
  const steps = followingSteps(log)

  return (
    <li
      className={cn(
        'rounded-md border text-xs',
        log.contractIssues.some((issue) => issue.type !== 'extra') && 'border-destructive/50',
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-2 py-1.5 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="w-11 shrink-0 font-mono font-semibold">{log.method}</span>
        <span className="flex-1 truncate font-mono">{log.path}</span>
        {log.mock && <span className="bg-highlight rounded px-1">목</span>}
        {log.contractIssues.some((issue) => issue.type !== 'extra') && (
          <span className="bg-destructive/10 text-destructive rounded px-1">계약 불일치</span>
        )}
        <span className={cn('w-8 text-right font-mono font-semibold', statusColor(log.status))}>
          {log.status ?? '실패'}
        </span>
        <span className="text-muted-foreground w-11 text-right">{log.durationMs}ms</span>
      </button>
      <div className="text-muted-foreground flex gap-2 px-2 pb-1">
        {log.action && <span>↳ {log.action}</span>}
        <span className="ml-auto">{log.actor ? `회원 ${log.actor}` : '토큰 없음'}</span>
      </div>
      {steps.length > 0 && <FlowSteps steps={steps} />}
      {open && (
        <div className="space-y-1 border-t p-2">
          {log.contractIssues.length > 0 && <IssueList log={log} />}
          <JsonBlock label="요청" value={log.requestBody} />
          <JsonBlock label="응답" value={log.responseBody} />
        </div>
      )}
    </li>
  )
}

function ChangeList({ changes }: { changes: StateChange[] }) {
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

function ContractList({ logs }: { logs: ApiCallLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="text-muted-foreground p-2 text-xs">
        응답이 FE가 기대한 모양(DTO)과 다르면 여기에 쌓여요. 화면은 매퍼가 흡수해 그대로 동작해요.
      </p>
    )
  }
  return (
    <ol className="space-y-1">
      {[...logs].reverse().map((log) => (
        <li key={log.id} className="rounded-md border p-2 text-xs">
          <div className="mb-1 font-mono font-semibold">
            {log.method} {log.path}{' '}
            {log.mock && <span className="bg-highlight rounded px-1 font-sans">목</span>}
          </div>
          <IssueList log={log} />
        </li>
      ))}
    </ol>
  )
}

const ISSUE_LABEL = {
  missing: '없음',
  type: '타입 다름',
  enum: '값 다름',
  extra: '추가 필드',
} as const

function IssueList({ log }: { log: ApiCallLog }) {
  return (
    <ul className="space-y-0.5">
      {log.contractIssues.map((issue) => (
        <li key={`${issue.path}-${issue.type}`} className="font-mono">
          <span className={issue.type === 'extra' ? 'text-muted-foreground' : 'text-destructive'}>
            [{ISSUE_LABEL[issue.type]}]
          </span>{' '}
          {issue.path} · 기대 {issue.expected} · 실제 {issue.actual}
        </li>
      ))}
    </ul>
  )
}

function MockSettings() {
  const enabled = useMockSettings((state) => state.enabled)
  const toggle = useMockSettings((state) => state.toggle)
  return (
    <div className="space-y-2 p-1 text-xs">
      <p className="text-muted-foreground">
        백엔드에 아직 없는 API는 목으로 응답해요. 백엔드가 들어오면 해당 도메인을 끄고 실제 서버로
        확인하세요.
      </p>
      {Object.entries(enabled).map(([domain, on]) => (
        <label
          key={domain}
          className="flex items-center justify-between rounded-md border px-2 py-1.5"
        >
          <span className="font-medium">{domain}</span>
          <span className="flex items-center gap-2">
            <span className={on ? 'text-primary' : 'text-muted-foreground'}>
              {on ? '목 사용' : '실제 서버'}
            </span>
            <input type="checkbox" checked={on} onChange={() => toggle(domain)} />
          </span>
        </label>
      ))}
    </div>
  )
}

const DOMAIN_NAME: Record<DomainId, string> = {
  member: '회원',
  product: '상품',
  recommend: '추천',
  order: '주문',
  payment: '결제',
  settlement: '정산',
  toss: '토스',
  kakao: '카카오',
}

function FlowSteps({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="mx-2 mb-2 rounded border border-dashed p-1.5">
      <div className="text-muted-foreground mb-1 text-[11px]">
        서버에서 이어지는 처리 (설계 기준)
      </div>
      <ol className="space-y-0.5">
        {steps.map((step) => (
          <li key={step.name}>
            <span className="text-primary font-mono font-semibold">{step.name}</span>{' '}
            <span className="text-muted-foreground">
              {DOMAIN_NAME[step.from]} → {step.to.map((to) => DOMAIN_NAME[to]).join(' · ')}
            </span>
            <div className="text-muted-foreground pl-2">{step.description}</div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === '') {
    return null
  }
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <pre className="bg-muted max-h-48 overflow-auto rounded p-1.5 text-[11px]">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}

function statusColor(status: number | null): string {
  if (status === null || status >= 500) return 'text-destructive'
  if (status >= 400) return 'text-orange-600'
  return 'text-green-700'
}
