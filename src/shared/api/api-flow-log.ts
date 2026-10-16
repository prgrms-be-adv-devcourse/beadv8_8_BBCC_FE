import { create } from 'zustand'
import type { ContractIssue } from './contract'

/** 흐름 패널에 보여 줄 API 호출 1건 */
export type ApiCallLog = {
  id: number
  /** 사용자 행동 이름 (예: "주문하기"). runWithAction 밖에서 호출되면 null */
  action: string | null
  /** 호출한 회원 (Authorization 토큰의 sub). 토큰 없이 보냈으면 null */
  actor: string | null
  method: string
  path: string
  /** 응답을 받지 못했으면 null */
  status: number | null
  durationMs: number
  /** ISO 시각 */
  startedAt: string
  /** 목 응답이면 true (응답 헤더 x-mock: true) */
  mock: boolean
  /** 요청이 미리 밝힌 예상 응답이면 그 이유 (실패로 세지 않는다). 예전 기록에는 없다 */
  expectedReason?: string | null
  requestBody: unknown
  responseBody: unknown
  /** 응답이 계약(DTO 모양)과 다른 곳 */
  contractIssues: ContractIssue[]
  /** 호출할 때의 시연 단계 (①~⑦ · 시작 · 확인). 시연 콘솔 밖이면 null. 예전 기록에는 없다 */
  step?: string | null
}

type ApiFlowLogState = {
  logs: ApiCallLog[]
  currentAction: string | null
  /** 지금 시연 단계 (콘솔 레이아웃이 주소로 정한다). 새 기록에 step으로 붙는다 */
  currentStep: string | null
  setCurrentStep: (step: string | null) => void
  /** 흐름 패널이 펼쳐 보여 줄 호출 (자동 시연 실패 → "이 호출 보기") */
  focusedLogId: number | null
  focusLog: (logId: number | null) => void
  add: (log: Omit<ApiCallLog, 'id' | 'contractIssues' | 'step'>) => number
  attachContractIssues: (logId: number, issues: ContractIssue[]) => void
  clear: () => void
}

const MAX_LOGS = 300
// 토스 결제창 이동 · 새로고침 뒤에도 검증 기록이 이어지도록 탭에 저장한다
const STORAGE_KEY = 'kidly.api-flow-log'

function loadLogs(): ApiCallLog[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]') as ApiCallLog[]
  } catch {
    return []
  }
}

function saveLogs(logs: ApiCallLog[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  } catch {
    // 용량 초과 등은 무시 (메모리에는 남는다)
  }
}

const initialLogs = loadLogs()
let nextId = (initialLogs.at(-1)?.id ?? 0) + 1

export const useApiFlowLog = create<ApiFlowLogState>()((set) => ({
  logs: initialLogs,
  currentAction: null,
  currentStep: null,
  setCurrentStep: (step) => set({ currentStep: step }),
  focusedLogId: null,
  focusLog: (logId) => set({ focusedLogId: logId }),
  add: (log) => {
    const id = nextId++
    set((state) => {
      const logs = [
        ...state.logs,
        { ...log, id, contractIssues: [], step: state.currentStep },
      ].slice(-MAX_LOGS)
      saveLogs(logs)
      return { logs }
    })
    return id
  },
  attachContractIssues: (logId, issues) =>
    set((state) => {
      const logs = state.logs.map((log) =>
        log.id === logId ? { ...log, contractIssues: [...log.contractIssues, ...issues] } : log,
      )
      saveLogs(logs)
      return { logs }
    }),
  clear: () => {
    saveLogs([])
    set({ logs: [] })
  },
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
