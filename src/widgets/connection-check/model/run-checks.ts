import type { Role } from '@/entities/session'
import { getErrorStatus, useApiFlowLog } from '@/shared/api'
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
