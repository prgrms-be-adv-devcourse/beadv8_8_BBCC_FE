import { useState } from 'react'
import { useApiFlowLog, type ApiCallLog } from '@/shared/api'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import type { DomainId, FlowStep } from '../config/domain-flow'
import { followingSteps, latestActionDomains } from '../model/flow-view'
import { DomainFlowMap } from './DomainFlowMap'

/** 화면에서 일어난 API 호출과, 그 뒤 서버에서 이어지는 처리(설계 기준)를 보여 준다 */
export function ApiFlowPanel() {
  const logs = useApiFlowLog((state) => state.logs)
  const clear = useApiFlowLog((state) => state.clear)
  const { called, followed } = latestActionDomains(logs)

  return (
    <aside className="flex h-full min-h-0 flex-col border-l bg-white">
      <div className="space-y-2 border-b p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">도메인 흐름</h2>
          <span className="text-muted-foreground text-[11px]">■ 호출 □ 서버 이벤트로 이어짐</span>
        </div>
        <DomainFlowMap called={called} followed={followed} />
      </div>
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold">API 호출 (최신이 위)</h2>
        <Button size="xs" variant="ghost" onClick={clear}>
          지우기
        </Button>
      </div>
      <ol className="flex-1 space-y-1 overflow-y-auto p-2">
        {logs.length === 0 && (
          <li className="text-muted-foreground p-2 text-xs">
            화면을 조작하면 호출한 API가 여기에 순서대로 쌓여요.
          </li>
        )}
        {[...logs].reverse().map((log) => (
          <ApiCallRow key={log.id} log={log} />
        ))}
      </ol>
    </aside>
  )
}

function ApiCallRow({ log }: { log: ApiCallLog }) {
  const [open, setOpen] = useState(false)
  const steps = followingSteps(log)

  return (
    <li className="rounded-md border text-xs">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-2 py-1.5 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="w-11 shrink-0 font-mono font-semibold">{log.method}</span>
        <span className="flex-1 truncate font-mono">{log.path}</span>
        {log.mock && <span className="bg-highlight rounded px-1">목</span>}
        <span className={cn('w-8 text-right font-mono font-semibold', statusColor(log.status))}>
          {log.status ?? '실패'}
        </span>
        <span className="text-muted-foreground w-11 text-right">{log.durationMs}ms</span>
      </button>
      {log.action && <div className="text-muted-foreground px-2 pb-1">↳ {log.action}</div>}
      {steps.length > 0 && <FlowSteps steps={steps} />}
      {open && (
        <div className="space-y-1 border-t p-2">
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
  if (status === null || status >= 500) {
    return 'text-destructive'
  }
  if (status >= 400) {
    return 'text-orange-600'
  }
  return 'text-green-700'
}
