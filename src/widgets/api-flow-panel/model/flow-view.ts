import type { ApiCallLog } from '@/shared/api'
import { flowOf, type FlowStep } from '../config/domain-flow'

function isSuccess(log: ApiCallLog): boolean {
  return log.status !== null && log.status < 400
}

/** 성공한 호출 뒤 서버에서 이어지는 처리 (설계 기준) */
export function followingSteps(log: ApiCallLog): FlowStep[] {
  return isSuccess(log) ? flowOf(log.method, log.path) : []
}
