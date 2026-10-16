import { getErrorMessage, isFailedCall, runWithAction, useApiFlowLog } from '@/shared/api'
import {
  AUTO_DEMO_STEPS,
  AutoDemoError,
  type AutoDemoContext,
  type AutoDemoData,
  type DemoRole,
} from '../config/steps'
import { type AutoDemoFailedCall, type AutoDemoSpeed, useAutoDemo } from './auto-demo-store'
import { canStart, type PreflightItem } from './preflight'

/** 화면을 보여 주는 시간 */
export const SHOW_MS: Record<AutoDemoSpeed, number> = {
  slow: 4000,
  present: 2200,
  quick: 900,
  test: 150,
  step: 2200,
}

/** 단계 안의 기다림(결제 완료 확인 등)을 속도에 맞춘다 */
export function scaleWait(speed: AutoDemoSpeed, ms: number) {
  if (speed === 'test') return Math.min(ms, 300)
  if (speed === 'quick') return Math.min(ms, 600)
  if (speed === 'slow') return Math.round(ms * 1.5)
  return ms
}

class Stopped extends Error {}

let stopRequested = false
/** 이어서 실행할 때 쓰는 앞 단계 결과 (만든 자녀 · 상품 · 주문)와 마지막 역할 */
let saved: { data: AutoDemoData; role: DemoRole | null } | null = null

export function stopAutoDemo() {
  stopRequested = true
  useAutoDemo.getState().patch({ status: 'stopped', message: '멈췄어요', finishedAt: Date.now() })
}

export function togglePauseAutoDemo() {
  const { status, patch } = useAutoDemo.getState()
  if (status === 'running') patch({ status: 'paused' })
  else if (status === 'paused') patch({ status: 'running' })
}

/** → 키 · "다음 단계": 멈춘 상태면 이어 간다 */
export function nextAutoDemo() {
  const { status, patch } = useAutoDemo.getState()
  if (status === 'paused') patch({ status: 'running' })
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
  /** 시작 전 점검 */
  preflight: () => Promise<PreflightItem[]>
}

const stampOf = (date: Date) =>
  [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')

const lastLogId = () => useApiFlowLog.getState().logs.at(-1)?.id ?? 0

/** 이 단계에서 마지막으로 실패한 호출 */
function failedCallSince(logId: number): AutoDemoFailedCall | null {
  const log = useApiFlowLog
    .getState()
    .logs.filter((item) => item.id > logId && isFailedCall(item))
    .at(-1)
  if (!log) return null
  const body = log.responseBody as { detail?: unknown; title?: unknown } | null
  const detail = body && typeof body === 'object' ? (body.detail ?? body.title ?? null) : null
  return {
    logId: log.id,
    method: log.method,
    path: log.path,
    status: log.status,
    detail: typeof detail === 'string' ? detail : null,
  }
}

/** 시작 전 점검 → 막는 항목이 없으면 ①부터 실행 */
export async function startAutoDemo(deps: AutoDemoDeps): Promise<void> {
  stopRequested = false
  useAutoDemo.getState().patch({
    status: 'checking',
    step: -1,
    message: '시작 전 점검',
    checks: null,
    failedCall: null,
    startedAt: null,
    finishedAt: null,
  })
  const checks = await deps.preflight()
  if (stopRequested) return
  useAutoDemo.getState().patch({ checks })
  if (!canStart(checks)) {
    useAutoDemo.getState().patch({ status: 'blocked', message: '시작 전 점검에서 막힘' })
    return
  }
  await runAutoDemo(deps)
}

/**
 * 정상 흐름 ①~⑦: 단계마다 화면으로 이동하고 그 화면이 쓰는 API를 부른다 (버튼 클릭이 아니라 API 직접 호출).
 * from을 주면 앞 실행의 결과를 이어 받아 그 단계부터 다시 한다.
 */
export async function runAutoDemo(deps: AutoDemoDeps, from = 0): Promise<void> {
  const resume = from > 0 && saved !== null
  const start = resume ? from : 0
  stopRequested = false
  useAutoDemo.getState().patch({
    status: 'running',
    step: start,
    message: resume ? `${AUTO_DEMO_STEPS[start].no}부터 다시` : '시작',
    startedAt: Date.now(),
    finishedAt: null,
    failedCall: null,
  })
  const data: AutoDemoData = resume ? saved!.data : { stamp: stampOf(new Date()) }
  const resumeRole = resume ? saved!.role : null
  saved = { data, role: null }
  let role: DemoRole | null = null
  const ctx: AutoDemoContext = {
    data,
    as: async (next) => {
      if (role === next) return
      await wait(0)
      useAutoDemo.getState().patch({ message: `${next}로 바꿈` })
      await deps.signIn(next)
      role = next
      saved!.role = next
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
    wait: async (ms) => wait(scaleWait(useAutoDemo.getState().speed, ms)),
    say: (message) => useAutoDemo.getState().patch({ message }),
  }
  for (let index = start; index < AUTO_DEMO_STEPS.length; index += 1) {
    const step = AUTO_DEMO_STEPS[index]
    useAutoDemo.getState().patch({ step: index, message: step.title })
    const before = lastLogId()
    try {
      // 이어서 실행: 실패 때의 역할로 돌아가서 시작 (역할을 바꾸지 않는 단계도 있다)
      if (index === start && resumeRole) await ctx.as(resumeRole)
      await step.run(ctx)
      await deps.refresh()
      const last = index === AUTO_DEMO_STEPS.length - 1
      if (!last && useAutoDemo.getState().speed === 'step') {
        useAutoDemo.getState().patch({
          status: 'paused',
          message: `${step.no} 끝 · → 또는 "다음 단계"로 ${AUTO_DEMO_STEPS[index + 1].no}`,
        })
        await wait(0)
      }
    } catch (error) {
      if (error instanceof Stopped) return
      useAutoDemo.getState().patch({
        status: 'failed',
        message:
          error instanceof AutoDemoError ? error.message : `API 실패: ${getErrorMessage(error)}`,
        failedCall: failedCallSince(before),
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

/** 실패한 단계부터 다시 할 수 있으면 true (앞 실행 결과가 남아 있을 때) */
export const canResumeAutoDemo = () => saved !== null
