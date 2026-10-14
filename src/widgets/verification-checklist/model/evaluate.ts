import type { ApiCallLog } from '@/shared/api'
import type { VerificationCheck } from '../config/checks'

export type CheckResult = {
  state: 'pass' | 'fail' | 'waiting'
  evidence: string | null
  /** 통과 근거가 목 응답이면 true (실제 백엔드로 다시 확인 필요) */
  byMock: boolean
}

function describe(log: ApiCallLog): string {
  return `${log.startedAt.slice(11, 19)} ${log.method} ${log.path} → ${log.status ?? '응답 없음'}`
}

/** 흐름 기록에서 체크 하나의 결과를 판단한다. 한 번이라도 기대대로면 통과 */
export function evaluate(check: VerificationCheck, logs: ApiCallLog[]): CheckResult {
  if (check.logs) {
    const result = check.logs(logs)
    return result
      ? { state: result.pass ? 'pass' : 'fail', evidence: result.evidence, byMock: false }
      : { state: 'waiting', evidence: null, byMock: false }
  }
  const call = check.call!
  const matched = logs.filter(
    (log) => log.method === call.method && call.pattern.test(log.path.split('?')[0]),
  )
  const passed = matched.findLast(
    (log) => log.status !== null && log.status < 300 && (call.expect ? call.expect(log) : true),
  )
  if (passed) {
    return { state: 'pass', evidence: describe(passed), byMock: passed.mock }
  }
  const last = matched.at(-1)
  if (last) {
    return { state: 'fail', evidence: describe(last), byMock: last.mock }
  }
  return { state: 'waiting', evidence: null, byMock: false }
}
