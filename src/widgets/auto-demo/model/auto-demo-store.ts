import { create } from 'zustand'
import type { PreflightItem } from './preflight'

/** 천천히 · 발표 · 빠르게 · 테스트(쉬지 않음) · 단계마다 멈춤(→로 다음) */
export type AutoDemoSpeed = 'slow' | 'present' | 'quick' | 'test' | 'step'
export type AutoDemoStatus =
  'idle' | 'checking' | 'blocked' | 'running' | 'paused' | 'done' | 'failed' | 'stopped'

export const AUTO_DEMO_SPEEDS: { value: AutoDemoSpeed; label: string }[] = [
  { value: 'slow', label: '천천히 (화면마다 4초)' },
  { value: 'present', label: '발표 (화면마다 2초)' },
  { value: 'quick', label: '빠르게 (화면마다 1초)' },
  { value: 'test', label: '테스트 (쉬지 않음)' },
  { value: 'step', label: '단계마다 멈춤 (→로 다음)' },
]

/** 실패한 호출 (흐름 패널에서 찾아 펼칠 수 있게 ID를 둔다) */
export type AutoDemoFailedCall = {
  logId: number
  method: string
  path: string
  status: number | null
  detail: string | null
}

type AutoDemoState = {
  status: AutoDemoStatus
  speed: AutoDemoSpeed
  /** 지금 단계 (0부터). 시작 전이면 -1 */
  step: number
  /** 지금 하는 일 한 줄 (예: "보호자로 바꿈 → 장바구니") */
  message: string
  startedAt: number | null
  finishedAt: number | null
  /** 시작 전 점검 결과. 점검 전이면 null */
  checks: PreflightItem[] | null
  /** 실패했을 때 마지막으로 실패한 API 호출 */
  failedCall: AutoDemoFailedCall | null
  setSpeed: (speed: AutoDemoSpeed) => void
  patch: (state: Partial<AutoDemoState>) => void
}

const SPEED_KEY = 'kidly.auto-demo-speed'

function loadSpeed(): AutoDemoSpeed {
  try {
    const saved = localStorage.getItem(SPEED_KEY)
    return AUTO_DEMO_SPEEDS.some((item) => item.value === saved)
      ? (saved as AutoDemoSpeed)
      : 'present'
  } catch {
    return 'present'
  }
}

export const useAutoDemo = create<AutoDemoState>()((set) => ({
  status: 'idle',
  speed: loadSpeed(),
  step: -1,
  message: '',
  startedAt: null,
  finishedAt: null,
  checks: null,
  failedCall: null,
  setSpeed: (speed) => {
    try {
      localStorage.setItem(SPEED_KEY, speed)
    } catch {
      // 저장 못 해도 이번 탭에서는 쓴다
    }
    set({ speed })
  },
  patch: (state) => set(state),
}))
