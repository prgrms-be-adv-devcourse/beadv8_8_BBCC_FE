import { getErrorMessage, runWithAction } from '@/shared/api'
import {
  AUTO_DEMO_STEPS,
  AutoDemoError,
  type AutoDemoContext,
  type AutoDemoData,
  type DemoRole,
} from '../config/steps'
import { type AutoDemoSpeed, useAutoDemo } from './auto-demo-store'

/** 화면을 보여 주는 시간 (발표: 천천히, 테스트: 쉬지 않음) */
const SHOW_MS: Record<AutoDemoSpeed, number> = { present: 2200, test: 150 }

class Stopped extends Error {}

let stopRequested = false

export function stopAutoDemo() {
  stopRequested = true
  useAutoDemo.getState().patch({ status: 'stopped', message: '멈췄어요', finishedAt: Date.now() })
}

export function togglePauseAutoDemo() {
  const { status, patch } = useAutoDemo.getState()
  if (status === 'running') patch({ status: 'paused' })
  else if (status === 'paused') patch({ status: 'running' })
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** 조금씩 자면서 일시정지 · 멈춤을 확인한다 */
async function wait(ms: number) {
  let left = ms
  for (;;) {
    if (stopRequested) throw new Stopped()
    if (useAutoDemo.getState().status === 'paused') {
      await sleep(100)
      continue
    }
    if (left <= 0) return
    await sleep(Math.min(100, left))
    left -= 100
  }
}

export type AutoDemoDeps = {
  navigate: (path: string) => void
  /** 화면 데이터를 다시 받는다 (조회 캐시 무효화) */
  refresh: () => Promise<void>
  signIn: (role: DemoRole) => Promise<void>
}

const stampOf = (date: Date) =>
  [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')

/** 정상 흐름 ①~⑦: 단계마다 화면으로 이동하고 그 화면이 쓰는 API를 부른다 (버튼 클릭이 아니라 API 직접 호출) */
export async function runAutoDemo(deps: AutoDemoDeps): Promise<void> {
  const store = useAutoDemo.getState()
  stopRequested = false
  store.patch({
    status: 'running',
    step: 0,
    message: '시작',
    startedAt: Date.now(),
    finishedAt: null,
  })
  const data: AutoDemoData = { stamp: stampOf(new Date()) }
  let role: DemoRole | null = null
  const ctx: AutoDemoContext = {
    data,
    as: async (next) => {
      if (role === next) return
      await wait(0)
      useAutoDemo.getState().patch({ message: `${next}로 바꿈` })
      await deps.signIn(next)
      role = next
    },
    show: async (path, message) => {
      await wait(0)
      useAutoDemo.getState().patch({ message })
      deps.navigate(path)
      await wait(SHOW_MS[useAutoDemo.getState().speed])
    },
    call: async (name, fn) => {
      await wait(0)
      const result = await runWithAction(`자동 시연 · ${name}`, fn)
      await deps.refresh()
      return result
    },
    wait: async (ms) => wait(useAutoDemo.getState().speed === 'test' ? Math.min(ms, 300) : ms),
    say: (message) => useAutoDemo.getState().patch({ message }),
  }
  for (const [index, step] of AUTO_DEMO_STEPS.entries()) {
    useAutoDemo.getState().patch({ step: index, message: step.title })
    try {
      await step.run(ctx)
      await deps.refresh()
    } catch (error) {
      if (error instanceof Stopped) return
      useAutoDemo.getState().patch({
        status: 'failed',
        message:
          error instanceof AutoDemoError ? error.message : `API 실패: ${getErrorMessage(error)}`,
        finishedAt: Date.now(),
      })
      return
    }
  }
  useAutoDemo.getState().patch({
    status: 'done',
    step: AUTO_DEMO_STEPS.length,
    message: '①~⑦ 통과',
    finishedAt: Date.now(),
  })
}
