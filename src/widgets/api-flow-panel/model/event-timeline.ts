import type { ApiCallLog } from '@/shared/api'
import { flowOf, ORDER_FAILURE_STEPS, type DomainId, type FlowStep } from '../config/domain-flow'

/** done 끝남 · pending 기다리는 중 · failed 실패 · compensate 보상(되돌리기) */
export type EdgeState = 'done' | 'pending' | 'failed' | 'compensate'

export type TimelineStep = FlowStep & { state: EdgeState }

export type EventTimeline = {
  /** 바뀌면 그림을 처음부터 다시 그린다 */
  signature: string
  /** 화면 행동 (예: 주문하기) */
  title: string
  /** 호출한 도메인 */
  origin: DomainId | null
  at: string
  steps: TimelineStep[]
  outcome: { tone: 'success' | 'pending' | 'fail'; text: string } | null
}

type Json = Record<string, unknown>
const bodyOf = (log: ApiCallLog): Json =>
  typeof log.responseBody === 'object' && log.responseBody !== null
    ? (log.responseBody as Json)
    : {}

const ok = (log: ApiCallLog) => log.status !== null && log.status < 400

const withState = (step: FlowStep, state: EdgeState): TimelineStep => ({ ...step, state })

/** 주문하기 뒤: 그 주문을 다시 조회한 결과(결제 완료 · 취소 사유)로 어디까지 갔는지 정한다 */
function orderTimeline(post: ApiCallLog, logs: ApiCallLog[], base: FlowStep[]) {
  const orderId = String(bodyOf(post).orderId ?? '')
  const later = logs.filter(
    (log) =>
      log.id > post.id && log.method === 'GET' && ok(log) && log.path === `/orders/${orderId}`,
  )
  const latest = later.at(-1)
  const status = latest ? String(bodyOf(latest).status) : 'PENDING_PAYMENT'
  const reason = latest ? (bodyOf(latest).cancelReason as string | null) : null
  const [created, deducted, requested] = base
  const seconds = (log: ApiCallLog) =>
    ((new Date(log.startedAt).getTime() - new Date(post.startedAt).getTime()) / 1000).toFixed(1)

  if (status === 'PAID') {
    const paidAt = later.find((log) => bodyOf(log).status === 'PAID') ?? latest!
    return {
      status,
      steps: base.map((step) => withState(step, 'done')),
      outcome: { tone: 'success' as const, text: `결제 완료 · ${seconds(paidAt)}초` },
    }
  }
  if (status === 'CANCELLED') {
    const F = ORDER_FAILURE_STEPS
    if (reason === 'OUT_OF_STOCK') {
      return {
        status: `${status}:${reason}`,
        steps: [withState(created, 'done'), withState(F.stockFailed, 'failed')],
        outcome: { tone: 'fail' as const, text: '구매할 수 없는 상품 → 주문 취소' },
      }
    }
    if (reason === 'PAYMENT_FAILED') {
      return {
        status: `${status}:${reason}`,
        steps: [
          withState(created, 'done'),
          withState(deducted, 'done'),
          withState(requested, 'done'),
          withState(F.paymentFailed, 'failed'),
          withState(F.cancelled, 'compensate'),
        ],
        outcome: { tone: 'fail' as const, text: '결제 실패 → 주문 취소 · 재고 복구' },
      }
    }
    return {
      status: `${status}:${reason}`,
      steps: [
        withState(created, 'done'),
        withState(F.paymentExpired, 'failed'),
        withState(F.cancelled, 'compensate'),
      ],
      outcome: { tone: 'fail' as const, text: '결제 시간 초과 → 주문 취소 · 재고 복구' },
    }
  }
  return {
    status,
    steps: base.map((step, index) => withState(step, index === 0 ? 'done' : 'pending')),
    outcome: { tone: 'pending' as const, text: '서버 이벤트 처리 중…' },
  }
}

/**
 * 사용자가 마지막으로 한 행동 중 서버 처리가 이어지는 호출(설계 기준)을 그림용 단계로 만든다.
 * 주문하기는 실제 조회 결과로 진행 · 실패 · 보상을 나눈다. 배경 호출(행동 이름 없음)은 건너뛴다
 */
export function latestTimeline(
  logs: ApiCallLog[],
  domainOf: (path: string) => DomainId | null,
): EventTimeline | null {
  const trigger = logs.findLast(
    (log) => log.action !== null && ok(log) && flowOf(log.method, log.path).length > 0,
  )
  if (!trigger) return null
  const base = flowOf(trigger.method, trigger.path)
  const isOrder = trigger.method === 'POST' && trigger.path.split('?')[0] === '/orders'
  const result = isOrder
    ? orderTimeline(trigger, logs, base)
    : { status: 'done', steps: base.map((step) => withState(step, 'done')), outcome: null }
  return {
    signature: `${trigger.id}:${result.status}`,
    title: trigger.action ?? `${trigger.method} ${trigger.path}`,
    origin: domainOf(trigger.path),
    at: trigger.startedAt,
    steps: result.steps,
    outcome: result.outcome,
  }
}
