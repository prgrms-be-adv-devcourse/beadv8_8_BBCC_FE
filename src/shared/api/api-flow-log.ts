import { create } from 'zustand'

/** 흐름 패널에 보여 줄 API 호출 1건 */
export type ApiCallLog = {
  id: number
  /** 사용자 행동 이름 (예: "주문하기"). runWithAction 밖에서 호출되면 null */
  action: string | null
  method: string
  path: string
  /** 응답을 받지 못했으면 null */
  status: number | null
  durationMs: number
  startedAt: Date
  /** msw 목 응답이면 true (응답 헤더 x-mock: true) */
  mock: boolean
  requestBody: unknown
  responseBody: unknown
}

type ApiFlowLogState = {
  logs: ApiCallLog[]
  currentAction: string | null
  add: (log: Omit<ApiCallLog, 'id'>) => void
  clear: () => void
}

const MAX_LOGS = 200
let nextId = 1

export const useApiFlowLog = create<ApiFlowLogState>()((set) => ({
  logs: [],
  currentAction: null,
  add: (log) =>
    set((state) => ({ logs: [...state.logs, { ...log, id: nextId++ }].slice(-MAX_LOGS) })),
  clear: () => set({ logs: [] }),
}))

/** fn 안에서 일어난 API 호출을 action 이름으로 묶어 기록한다 */
export async function runWithAction<T>(action: string, fn: () => Promise<T>): Promise<T> {
  useApiFlowLog.setState({ currentAction: action })
  try {
    return await fn()
  } finally {
    useApiFlowLog.setState({ currentAction: null })
  }
}
