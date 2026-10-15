import { create } from 'zustand'

export type AutoDemoSpeed = 'present' | 'test'
export type AutoDemoStatus = 'idle' | 'running' | 'paused' | 'done' | 'failed' | 'stopped'

type AutoDemoState = {
  status: AutoDemoStatus
  speed: AutoDemoSpeed
  /** 지금 단계 (0부터). 시작 전이면 -1 */
  step: number
  /** 지금 하는 일 한 줄 (예: "보호자로 바꿈 → 장바구니") */
  message: string
  startedAt: number | null
  finishedAt: number | null
  setSpeed: (speed: AutoDemoSpeed) => void
  patch: (state: Partial<AutoDemoState>) => void
}

export const useAutoDemo = create<AutoDemoState>()((set) => ({
  status: 'idle',
  speed: 'present',
  step: -1,
  message: '',
  startedAt: null,
  finishedAt: null,
  setSpeed: (speed) => set({ speed }),
  patch: (state) => set(state),
}))
