import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { signInAsDemo } from '@/entities/session'
import { DEMO_ACCOUNTS } from '@/features/switch-demo-role'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { AUTO_DEMO_STEPS, type DemoRole } from '../config/steps'
import { useAutoDemo } from '../model/auto-demo-store'
import { runAutoDemo, stopAutoDemo, togglePauseAutoDemo } from '../model/run-auto-demo'

/** 시연 콘솔 아래 조작 막대: 버튼 하나로 정상 흐름 ①~⑦ (화면 이동 + API 호출, 흐름 패널에 실시간 표시) */
export function AutoDemoBar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { status, speed, step, message, startedAt, finishedAt, setSpeed } = useAutoDemo()
  const active = status === 'running' || status === 'paused'
  const seconds = startedAt && finishedAt ? Math.round((finishedAt - startedAt) / 1000) : null

  const start = () =>
    void runAutoDemo({
      navigate: (path) => navigate(path),
      refresh: () => queryClient.invalidateQueries(),
      signIn: async (role: DemoRole) => {
        const account = DEMO_ACCOUNTS.find((item) => item.label === role)
        if (account) await signInAsDemo(account)
      },
    })

  return (
    <div
      role="region"
      aria-label="자동 시연"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t bg-white px-4 py-2 text-sm"
    >
      {!active && (
        <Button size="sm" onClick={start}>
          {status === 'idle' ? '▶ 자동 시연' : '↻ 다시 실행'}
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
          status === 'failed' ? 'text-destructive font-medium' : 'text-muted-foreground',
        )}
      >
        {status === 'idle' &&
          '버튼 하나로 ①~⑦을 진행해요. 화면이 차례로 바뀌고 오른쪽에 API 흐름이 쌓여요'}
        {active && (status === 'paused' ? `일시정지 · ${message}` : message)}
        {status === 'done' && `✓ 자동 시연 끝 · ①~⑦ 통과 · ${seconds}초`}
        {status === 'failed' && `✕ ${AUTO_DEMO_STEPS[step]?.no}에서 멈춤 · ${message}`}
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
          onChange={(e) => setSpeed(e.target.value as typeof speed)}
        >
          <option value="present">발표 (화면마다 2초)</option>
          <option value="test">테스트 (쉬지 않음)</option>
        </select>
      </label>
      {active && (
        <>
          <Button size="sm" variant="outline" onClick={togglePauseAutoDemo}>
            {status === 'paused' ? '▶ 계속' : '⏸ 일시정지'}
          </Button>
          <Button size="sm" variant="ghost" onClick={stopAutoDemo}>
            ⏹ 멈춤
          </Button>
        </>
      )}
    </div>
  )
}
