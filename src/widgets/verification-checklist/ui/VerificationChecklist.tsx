import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useApiFlowLog, type ApiCallLog } from '@/shared/api'
import { cn } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { FAILURE_CHECKS, VERIFICATION_CHECKS, type VerificationCheck } from '../config/checks'
import { evaluate, type CheckResult } from '../model/evaluate'

const STATE_LABEL = { pass: '통과', fail: '실패', waiting: '대기' } as const

type Row = { check: VerificationCheck; result: CheckResult }

const evaluateAll = (checks: VerificationCheck[], logs: ApiCallLog[]): Row[] =>
  checks.map((check) => ({ check, result: evaluate(check, logs) }))

const toText = (rows: Row[]) =>
  rows
    .map(
      ({ check, result }) =>
        `- [${result.state === 'pass' ? 'x' : ' '}] ${check.step} ${check.title} — ${STATE_LABEL[result.state]}${result.byMock ? ' (목)' : ''}${result.evidence ? ` · ${result.evidence}` : ''}`,
    )
    .join('\n')

/**
 * 흐름 기록으로 ①~⑦ 완료 기준(기획서 7장)과 취소 · 실패 시나리오(2.1)를 자동 판정한다.
 * 기록은 탭에 남으므로 화면을 오가며 진행하면 된다
 */
export function VerificationChecklist() {
  const logs = useApiFlowLog((state) => state.logs)
  const main = evaluateAll(VERIFICATION_CHECKS, logs)
  const failure = evaluateAll(FAILURE_CHECKS, logs)

  const copy = () => {
    void navigator.clipboard
      ?.writeText(
        `# Kidly 정상 흐름 확인\n\n${toText(main)}\n\n## 취소 · 실패 시나리오\n\n${toText(failure)}\n`,
      )
      .catch(() => undefined)
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Counts
          rows={main}
          action={
            <Button size="sm" variant="outline" className="ml-auto" onClick={copy}>
              결과 복사
            </Button>
          }
        />
        <CheckRows rows={main} />
      </section>
      <section className="space-y-3" aria-label="취소 · 실패 시나리오">
        <h2 className="font-semibold">취소 · 실패 시나리오 (기획서 2.1, 정상 흐름 다음)</h2>
        <Counts rows={failure} />
        <CheckRows rows={failure} />
      </section>
    </div>
  )
}

function Counts({ rows, action }: { rows: Row[]; action?: ReactNode }) {
  const count = (state: string) => rows.filter(({ result }) => result.state === state).length
  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant="success">통과 {count('pass')}</Badge>
      <Badge variant="destructive">실패 {count('fail')}</Badge>
      <Badge variant="muted">대기 {count('waiting')}</Badge>
      <span className="text-muted-foreground">/ {rows.length}</span>
      {action}
    </div>
  )
}

function CheckRows({ rows }: { rows: Row[] }) {
  return rows.map(({ check, result }) => (
    <Card
      key={check.id}
      className={cn(
        'flex items-center gap-3 py-2',
        result.state === 'fail' && 'border-destructive',
      )}
    >
      <span className="text-primary w-8 text-sm font-bold">{check.step}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">
          {check.title} <span className="text-muted-foreground text-xs">({check.role})</span>
        </p>
        <p className="text-muted-foreground text-xs">기대: {check.expected}</p>
        {result.evidence && <p className="font-mono text-xs">{result.evidence}</p>}
      </div>
      {result.byMock && <Badge variant="highlight">목</Badge>}
      <Badge
        variant={
          result.state === 'pass' ? 'success' : result.state === 'fail' ? 'destructive' : 'muted'
        }
      >
        {STATE_LABEL[result.state]}
      </Badge>
      <Link to={check.screen} className="text-primary text-xs underline">
        화면
      </Link>
    </Card>
  ))
}
