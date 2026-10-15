import { useState } from 'react'
import type { ApiCallLog } from '@/shared/api'
import { cn } from '@/shared/lib'
import type { DomainId, FlowStep } from '../config/domain-flow'
import { followingSteps } from '../model/flow-view'
import { IssueList } from './IssueList'

type CallListProps = { logs: ApiCallLog[] }

export function CallList({ logs }: CallListProps) {
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

type ApiCallRowProps = { log: ApiCallLog }

function ApiCallRow({ log }: ApiCallRowProps) {
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
        {log.expectedReason && (
          <span className="bg-muted text-muted-foreground rounded px-1" title={log.expectedReason}>
            예상됨
          </span>
        )}
        {log.contractIssues.some((issue) => issue.type !== 'extra') && (
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
      <div className="text-muted-foreground flex gap-2 px-2 pb-1">
        {log.action && <span>↳ {log.action}</span>}
        {log.expectedReason && <span className="truncate">{log.expectedReason}</span>}
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

type FlowStepsProps = { steps: FlowStep[] }

function FlowSteps({ steps }: FlowStepsProps) {
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

type JsonBlockProps = { label: string; value: unknown }

function JsonBlock({ label, value }: JsonBlockProps) {
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
