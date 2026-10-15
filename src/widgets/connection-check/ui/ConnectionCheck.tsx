import { useState } from 'react'
import { useSessionStore } from '@/entities/session'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Card, CardTitle } from '@/shared/ui/card'
import { StateMessage } from '@/shared/ui/StateMessage'
import { CONNECTION_CHECKS } from '../config/checks'
import {
  type CheckResult,
  type CheckStatus,
  probeMockEndpoints,
  type ProbeResult,
  type ProbeStatus,
  runConnectionChecks,
} from '../model/run-checks'

const STATUS_LABEL: Record<CheckStatus, string> = {
  pass: '통과',
  contract: '계약 다름',
  fail: '실패',
  role: '건너뜀',
  nodata: '데이터 없음',
  mock: '목 응답',
}

const STATUS_TONE: Record<CheckStatus, string> = {
  pass: 'text-green-700',
  contract: 'text-amber-700',
  fail: 'text-destructive font-semibold',
  role: 'text-muted-foreground',
  nodata: 'text-muted-foreground',
  mock: 'text-amber-700',
}

const PROBE_LABEL: Record<ProbeStatus, string> = {
  ready: 'BE 있음 → 실제로 전환 후보',
  missing: 'BE 아직 없음',
  forbidden: '권한 필요 (역할을 바꿔 다시)',
  error: '오류',
  skipped: '부르지 않음 (경로 변수 · 바꾸는 요청)',
}

/** 실제 백엔드에 조회 API를 한 번씩 불러 상태 · 계약 · 시간을 본다 (배포 환경 통합 점검용) */
export function ConnectionCheck() {
  const user = useSessionStore((state) => state.user)
  const [results, setResults] = useState<Record<string, CheckResult>>({})
  const [running, setRunning] = useState(false)
  const [probes, setProbes] = useState<ProbeResult[]>([])
  const [probing, setProbing] = useState(false)

  const run = async () => {
    setRunning(true)
    setResults({})
    await runConnectionChecks(
      CONNECTION_CHECKS,
      { loggedIn: user !== null, roles: user?.roles ?? [] },
      (result) => setResults((previous) => ({ ...previous, [result.id]: result })),
    )
    setRunning(false)
  }

  const probe = async () => {
    setProbing(true)
    setProbes([])
    await probeMockEndpoints((result) => setProbes((previous) => [...previous, result]))
    setProbing(false)
  }

  const counts = Object.values(results).reduce<Record<CheckStatus, number>>(
    (sum, result) => ({ ...sum, [result.status]: sum[result.status] + 1 }),
    { pass: 0, contract: 0, fail: 0, role: 0, nodata: 0, mock: 0 },
  )
  const done = Object.keys(results).length

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>실제 API 조회 점검</CardTitle>
          <Button onClick={() => void run()} disabled={running}>
            {running ? `점검 중… ${done}/${CONNECTION_CHECKS.length}` : '전체 점검 실행'}
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          조회(GET)만 차례로 불러요. 앞 결과의 ID로 상세를 이어서 부르고, 지금 역할로 못 부르는
          API는 건너뛰어요. 역할을 바꿔 다시 실행하면 판매자 · 관리자 API도 볼 수 있어요.
        </p>
        {done > 0 && (
          <p role="status" aria-label="점검 결과" className="text-sm font-medium">
            통과 {counts.pass} · 계약 다름 {counts.contract} · 실패 {counts.fail} · 목 응답{' '}
            {counts.mock} · 건너뜀 {counts.role + counts.nodata}
          </p>
        )}
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground text-xs">
            <tr>
              <th className="py-1 font-normal">기능</th>
              <th className="font-normal">API</th>
              <th className="font-normal">결과</th>
              <th className="text-right font-normal">응답 · 시간</th>
            </tr>
          </thead>
          <tbody>
            {CONNECTION_CHECKS.map((check) => {
              const result = results[check.id]
              return (
                <tr key={check.id} aria-label={`점검 ${check.label}`} className="border-t">
                  <td className="py-1.5">{check.label}</td>
                  <td className="font-mono text-xs">{check.api}</td>
                  <td className={cn(result && STATUS_TONE[result.status])}>
                    {result ? STATUS_LABEL[result.status] : '—'}
                    {result?.status === 'contract' && ` ${result.contractIssues}곳`}
                    {result?.note && (
                      <span className="text-muted-foreground ml-1 text-xs">({result.note})</span>
                    )}
                  </td>
                  <td className="text-muted-foreground text-right text-xs">
                    {result?.httpStatus ?? ''}
                    {result?.durationMs != null && ` · ${result.durationMs}ms`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {counts.contract > 0 && (
          <StateMessage>
            계약이 다른 곳은 오른쪽 흐름 패널의 "계약" 탭에서 필드별로 보여요.
          </StateMessage>
        )}
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>목 API가 백엔드에 생겼나</CardTitle>
          <Button variant="outline" onClick={() => void probe()} disabled={probing}>
            {probing ? '확인 중…' : '백엔드에 물어보기'}
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          목으로 응답하는 조회 API를 목을 거치지 않고 실제 서버에 불러요. "BE 있음"이면
          mock-endpoints에서 그 줄을 실제로 바꿀 후보예요 (응답 모양은 따로 맞춰야 해요).
        </p>
        {probes.length > 0 && (
          <ul className="space-y-1 text-sm">
            {probes.map((item) => (
              <li
                key={`${item.endpoint.method} ${item.endpoint.path}`}
                aria-label={`목 API ${item.endpoint.method} ${item.endpoint.path}`}
                className="flex flex-wrap justify-between gap-2 border-t pt-1"
              >
                <span className="font-mono text-xs">
                  {item.endpoint.method} {item.endpoint.path}
                </span>
                <span
                  className={cn(
                    'text-xs',
                    item.status === 'ready'
                      ? 'font-semibold text-green-700'
                      : 'text-muted-foreground',
                  )}
                >
                  {PROBE_LABEL[item.status]}
                  {item.httpStatus !== null && ` (${item.httpStatus})`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
