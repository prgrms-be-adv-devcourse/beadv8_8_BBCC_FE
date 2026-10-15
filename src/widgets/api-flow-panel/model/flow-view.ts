import type { ApiCallLog } from '@/shared/api'
import { domainOf, flowOf, type DomainId, type FlowStep } from '../config/domain-flow'

function isSuccess(log: ApiCallLog): boolean {
  return log.status !== null && log.status < 400
}

/** 성공한 호출 뒤 서버에서 이어지는 처리 (설계 기준) */
export function followingSteps(log: ApiCallLog): FlowStep[] {
  return isSuccess(log) ? flowOf(log.method, log.path) : []
}

/**
 * 사용자가 마지막으로 한 행동에서 호출된 도메인과, 성공한 호출 뒤 이벤트로 이어진 도메인.
 * 주문 상세 다시 조회 같은 배경 호출(행동 이름 없음)은 건너뛴다
 */
export function latestActionDomains(logs: ApiCallLog[]) {
  const called = new Set<DomainId>()
  const followed = new Set<DomainId>()
  const lastAction = logs.findLast((log) => log.action !== null)
  const last = lastAction ?? logs.at(-1)
  if (!last) {
    return { called, followed }
  }
  const group = lastAction
    ? logs.filter((log) => log.action === lastAction.action && log.id <= lastAction.id).slice(-10)
    : [last]
  for (const log of group) {
    const domain = domainOf(log.path)
    if (domain) called.add(domain)
    followingSteps(log).forEach((step) => step.to.forEach((to) => followed.add(to)))
  }
  return { called, followed }
}
