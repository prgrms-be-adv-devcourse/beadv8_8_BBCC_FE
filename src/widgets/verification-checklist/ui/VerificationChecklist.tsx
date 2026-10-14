import { Link } from 'react-router'
import { useApiFlowLog } from '@/shared/api'
import { cn } from '@/shared/lib'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { VERIFICATION_CHECKS } from '../config/checks'
import { evaluate } from '../model/evaluate'

const STATE_LABEL = { pass: '통과', fail: '실패', waiting: '대기' } as const

/** 흐름 기록으로 ①~⑦ 완료 기준을 자동 판정한다. 기록은 탭에 남으므로 화면을 오가며 진행하면 된다 */
export function VerificationChecklist() {
  const logs = useApiFlowLog((state) => state.logs)
  const results = VERIFICATION_CHECKS.map((check) => ({ check, result: evaluate(check, logs) }))
  const count = (state: string) => results.filter(({ result }) => result.state === state).length

  const copy = () => {
    const text = results
      .map(
        ({ check, result }) =>
          `- [${result.state === 'pass' ? 'x' : ' '}] ${check.step} ${check.title} — ${STATE_LABEL[result.state]}${result.byMock ? ' (목)' : ''}${result.evidence ? ` · ${result.evidence}` : ''}`,
      )
      .join('\n')
    void navigator.clipboard
      ?.writeText(`# Kidly 정상 흐름 확인\n\n${text}\n`)
      .catch(() => undefined)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="success">통과 {count('pass')}</Badge>
        <Badge variant="destructive">실패 {count('fail')}</Badge>
        <Badge variant="muted">대기 {count('waiting')}</Badge>
        <span className="text-muted-foreground">/ {results.length}</span>
        <Button size="sm" variant="outline" className="ml-auto" onClick={copy}>
          결과 복사
        </Button>
      </div>
      {results.map(({ check, result }) => (
        <Card
          key={check.id}
          className={cn(
            'flex items-center gap-3 py-2',
            result.state === 'fail' && 'border-destructive',
          )}
        >
          <span className="text-primary w-6 font-bold">{check.step}</span>
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
              result.state === 'pass'
                ? 'success'
                : result.state === 'fail'
                  ? 'destructive'
                  : 'muted'
            }
          >
            {STATE_LABEL[result.state]}
          </Badge>
          <Link to={check.screen} className="text-primary text-xs underline">
            화면
          </Link>
        </Card>
      ))}
    </div>
  )
}
