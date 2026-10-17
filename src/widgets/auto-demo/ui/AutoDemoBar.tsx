import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { signInAsDemo } from '@/entities/session'
import { DEMO_ACCOUNTS } from '@/features/switch-demo-role'
import { useApiFlowLog } from '@/shared/api'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { DEMO_CHARGE_AMOUNT, demoChargePath } from '../config/demo-charge'
import { checkBeforeDemo } from '../config/preflight-deps'
import { AUTO_DEMO_STEPS, type DemoRole } from '../config/steps'
import { AUTO_DEMO_SPEEDS, type AutoDemoSpeed, useAutoDemo } from '../model/auto-demo-store'
import type { PreflightItem } from '../model/preflight'
import {
  canResumeAutoDemo,
  nextAutoDemo,
  runAutoDemo,
  startAutoDemo,
  stopAutoDemo,
  togglePauseAutoDemo,
  type AutoDemoDeps,
} from '../model/run-auto-demo'
import { useAutoDemoKeys } from '../model/use-auto-demo-keys'

const MARK: Record<PreflightItem['state'], string> = { ok: '✓', warn: '⚠', fail: '✕' }

/** 시연 콘솔 아래 조작 막대: 버튼 하나로 정상 흐름 ①~⑦ (화면 이동 + API 호출, 흐름 패널에 실시간 표시) */
export function AutoDemoBar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { status, speed, step, message, startedAt, finishedAt, checks, failedCall, setSpeed } =
    useAutoDemo()
  const focusLog = useApiFlowLog((state) => state.focusLog)
  useAutoDemoKeys()
  const active = status === 'running' || status === 'paused'
  const seconds = startedAt && finishedAt ? Math.round((finishedAt - startedAt) / 1000) : null
  const failedStep = status === 'failed' ? AUTO_DEMO_STEPS[step] : undefined
  const stepPaused = status === 'paused' && speed === 'step'

  const deps: AutoDemoDeps = {
    navigate: (path) => navigate(path),
    refresh: () => queryClient.invalidateQueries(),
    signIn: async (role: DemoRole) => {
      const account = DEMO_ACCOUNTS.find((item) => item.label === role)
      if (account) await signInAsDemo(account)
    },
    preflight: checkBeforeDemo,
  }

  return (
    <div role="region" aria-label="자동 시연" className="border-t bg-white px-4 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {!active && status !== 'checking' && (
          <Button size="sm" onClick={() => void startAutoDemo(deps)}>
            {status === 'idle' ? '▶ 자동 시연' : '↻ 처음부터'}
          </Button>
        )}
        {failedStep && canResumeAutoDemo() && (
          <Button size="sm" variant="outline" onClick={() => void runAutoDemo(deps, step)}>
            ↻ {failedStep.no}부터 다시
          </Button>
        )}
        {status === 'blocked' && (
          <Button size="sm" variant="outline" onClick={() => void runAutoDemo(deps)}>
            그래도 시작
          </Button>
        )}
        <ol aria-label="자동 시연 단계" className="flex items-center gap-1">
          {AUTO_DEMO_STEPS.map((item, index) => {
            const done = status === 'done' || index < step
            const current = active && index === step
            const failed = status === 'failed' && index === step
            return (
              <li
                key={item.no}
                title={item.title}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs whitespace-nowrap',
                  done && 'bg-primary/15 text-primary',
                  current && 'bg-primary text-primary-foreground font-semibold',
                  failed && 'bg-destructive font-semibold text-white',
                  !done && !current && !failed && 'text-muted-foreground',
                )}
              >
                {item.no}
                {done && !current && ' ✓'}
                {(current || failed) && ` ${item.title}`}
              </li>
            )
          })}
        </ol>
        <p
          role="status"
          aria-label="자동 시연 상태"
          className={cn(
            'min-w-0 flex-1 truncate text-xs',
            status === 'failed' || status === 'blocked'
              ? 'text-destructive font-medium'
              : 'text-muted-foreground',
          )}
        >
          {status === 'idle' &&
            '버튼 하나로 ①~⑦을 진행해요. 시작 전에 서버 · 계정 · 예치금을 점검하고, 오른쪽에 API 흐름이 쌓여요'}
          {status === 'checking' && '시작 전 점검 중…'}
          {status === 'blocked' && '✕ 시작 전 점검에서 막혔어요. 아래 항목을 확인해 주세요'}
          {active && (status === 'paused' ? `일시정지 · ${message}` : message)}
          {status === 'done' && `✓ 자동 시연 끝 · ①~⑦ 통과 · ${seconds}초`}
          {status === 'failed' && `✕ ${failedStep?.no}에서 멈춤 · ${message}`}
          {status === 'stopped' && '멈췄어요'}
        </p>
        {status === 'done' && (
          <Link to={paths.console.verify} className="text-primary text-xs underline">
            흐름 확인 보기
          </Link>
        )}
        <label className="text-muted-foreground flex items-center gap-1 text-xs">
          속도
          <select
            aria-label="자동 시연 속도"
            className="rounded border bg-white px-1 py-0.5"
            value={speed}
            onChange={(e) => setSpeed(e.target.value as AutoDemoSpeed)}
          >
            {AUTO_DEMO_SPEEDS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {active && (
          <>
            {stepPaused ? (
              <Button size="sm" onClick={nextAutoDemo}>
                다음 단계 →
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={togglePauseAutoDemo}>
                {status === 'paused' ? '▶ 계속' : '⏸ 일시정지'}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={stopAutoDemo}>
              ⏹ 멈춤
            </Button>
            <span className="text-muted-foreground hidden text-[11px] xl:inline">
              Space 일시정지 · → 다음 · Esc 멈춤
            </span>
          </>
        )}
      </div>
      {checks && status !== 'idle' && (
        <ul
          aria-label="시작 전 점검"
          className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs"
        >
          {checks.map((item) => (
            <li
              key={item.key}
              title={item.detail}
              className={cn(
                'rounded border px-2 py-0.5',
                item.state === 'ok' && 'text-muted-foreground',
                item.state === 'warn' && 'border-amber-300 bg-amber-50 text-amber-900',
                item.state === 'fail' && 'border-destructive/40 bg-destructive/10 text-destructive',
              )}
            >
              {MARK[item.state]} {item.label}
              {item.state !== 'ok' && ` · ${item.detail}`}
              {item.action === 'charge' && (
                <button
                  type="button"
                  className="ml-2 font-semibold underline"
                  onClick={async () => {
                    await deps.signIn('보호자')
                    navigate(demoChargePath())
                  }}
                >
                  충전하러 가기 ({DEMO_CHARGE_AMOUNT.toLocaleString()}원)
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {status === 'failed' && failedCall && (
        <div
          role="group"
          aria-label="실패한 호출"
          className="border-destructive/30 bg-destructive/5 mt-1.5 flex flex-wrap items-center gap-2 rounded border px-2 py-1 text-xs"
        >
          <span className="font-mono">
            {failedCall.method} {failedCall.path}
          </span>
          <span className="text-destructive font-semibold">{failedCall.status ?? '응답 없음'}</span>
          {failedCall.detail && <span className="min-w-0 truncate">{failedCall.detail}</span>}
          <Button
            size="xs"
            variant="ghost"
            className="ml-auto"
            onClick={() => focusLog(failedCall.logId)}
          >
            이 호출 보기
          </Button>
        </div>
      )}
    </div>
  )
}
