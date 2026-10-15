import type { Role } from '@/entities/session'
import {
  apiClient,
  getErrorStatus,
  MOCK_ENDPOINTS,
  type MockEndpoint,
  useApiFlowLog,
} from '@/shared/api'
import { type CheckIds, type ConnectionCheck, MissingId } from '../config/checks'

export type CheckStatus =
  | 'pass'
  /** 응답은 왔지만 계약(DTO 모양)과 다른 곳이 있다 */
  | 'contract'
  /** 4xx · 5xx · 응답 없음 */
  | 'fail'
  /** 지금 역할로는 부를 수 없어 건너뜀 */
  | 'role'
  /** 상세 조회에 쓸 ID가 앞 결과에 없어 건너뜀 */
  | 'nodata'
  /** 목이 응답했다 (실제 서버를 거치지 않음) */
  | 'mock'

export type CheckResult = {
  id: string
  status: CheckStatus
  httpStatus: number | null
  contractIssues: number
  durationMs: number | null
  note: string | null
}

export type Viewer = { loggedIn: boolean; roles: Role[] }

function canCall(check: ConnectionCheck, viewer: Viewer): boolean {
  if (check.role === 'PUBLIC') return true
  if (!viewer.loggedIn) return false
  return check.role === null || viewer.roles.includes(check.role)
}

const lastLogId = () => useApiFlowLog.getState().logs.at(-1)?.id ?? 0

/** 점검 하나를 부르는 동안 흐름 기록에 쌓인 마지막 호출 (상태 · 계약 · 시간 · 목 여부를 그대로 쓴다) */
function logSince(id: number) {
  return useApiFlowLog
    .getState()
    .logs.filter((log) => log.id > id)
    .at(-1)
}

/** 차례로 부른다 (앞 결과의 ID를 뒤 상세 조회에 넘긴다). 바꾸는 요청은 없다 */
export async function runConnectionChecks(
  checks: ConnectionCheck[],
  viewer: Viewer,
  onResult: (result: CheckResult) => void,
): Promise<void> {
  const ids: CheckIds = {}
  for (const check of checks) {
    const base = { id: check.id, httpStatus: null, contractIssues: 0, durationMs: null }
    if (!canCall(check, viewer)) {
      onResult({
        ...base,
        status: 'role',
        note: check.role === null ? '로그인 필요' : `${check.role} 역할 필요`,
      })
      continue
    }
    if (check.needs && !ids[check.needs]) {
      onResult({ ...base, status: 'nodata', note: `앞 조회에 ${check.needs} 없음` })
      continue
    }
    const before = lastLogId()
    let data: unknown = null
    let failed = false
    try {
      data = await check.run(ids)
    } catch (error) {
      if (error instanceof MissingId) {
        onResult({ ...base, status: 'nodata', note: `앞 조회에 ${error.key} 없음` })
        continue
      }
      failed = true
      if (getErrorStatus(error) === null && !logSince(before)) {
        onResult({ ...base, status: 'fail', note: String((error as Error).message ?? error) })
        continue
      }
    }
    const log = logSince(before)
    const httpStatus = log?.status ?? null
    const contractIssues = log?.contractIssues.length ?? 0
    const status: CheckStatus = log?.mock
      ? 'mock'
      : failed && !log?.expectedReason
        ? 'fail'
        : contractIssues > 0
          ? 'contract'
          : 'pass'
    if (!failed && check.pick) Object.assign(ids, stripEmpty(check.pick(data)))
    onResult({
      id: check.id,
      status,
      httpStatus,
      contractIssues,
      durationMs: log?.durationMs ?? null,
      note: log?.expectedReason ?? null,
    })
  }
}

function stripEmpty(ids: CheckIds): CheckIds {
  return Object.fromEntries(Object.entries(ids).filter(([, value]) => value)) as CheckIds
}

export type ProbeStatus =
  /** 실제 서버가 2xx → BE에 생김, mock-endpoints에서 real로 바꿀 후보 */
  | 'ready'
  /** 404 · 405 → BE에 아직 없음 */
  | 'missing'
  /** 401 · 403 → 있을 수 있음, 역할을 바꿔 다시 */
  | 'forbidden'
  /** 그 밖의 오류 · 응답 없음 */
  | 'error'
  /** 경로 변수가 있거나 바꾸는 요청이라 부르지 않음 */
  | 'skipped'

export type ProbeResult = { endpoint: MockEndpoint; status: ProbeStatus; httpStatus: number | null }

/** 목 조회 API가 실제 BE에 생겼는지: 목을 건너뛰고 실제 서버에 묻는다 (GET · 경로 변수 없는 것만) */
export async function probeMockEndpoints(
  onResult: (result: ProbeResult) => void,
  endpoints: MockEndpoint[] = MOCK_ENDPOINTS.filter((item) => item.source === 'mock'),
): Promise<void> {
  for (const endpoint of endpoints) {
    if (endpoint.method !== 'GET' || endpoint.path.includes(':')) {
      onResult({ endpoint, status: 'skipped', httpStatus: null })
      continue
    }
    try {
      const response = await apiClient.get(endpoint.path, {
        skipMock: true,
        expected: {
          statuses: [401, 403, 404, 405],
          reason: '연결 점검: 목 API가 백엔드에 생겼는지 확인',
        },
      })
      onResult({ endpoint, status: 'ready', httpStatus: response.status })
    } catch (error) {
      const httpStatus = getErrorStatus(error)
      onResult({
        endpoint,
        httpStatus,
        status:
          httpStatus === 404 || httpStatus === 405
            ? 'missing'
            : httpStatus === 401 || httpStatus === 403
              ? 'forbidden'
              : 'error',
      })
    }
  }
}
