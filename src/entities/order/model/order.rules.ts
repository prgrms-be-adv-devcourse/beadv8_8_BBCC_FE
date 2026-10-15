import { carrierName } from '@/shared/config'
import {
  CANCEL_REASON_LABEL,
  UNAVAILABLE_REASON_LABEL,
  type Order,
  type OrderItem,
  type OrderStatus,
  type OrderTimelineEvent,
} from './order'

/** 결제 처리 중이면 서버 이벤트(재고 차감 → 예치금 결제)가 끝나기를 기다리며 다시 조회한다 */
export function isAwaitingPayment(order: Order): boolean {
  return order.status === 'PENDING_PAYMENT'
}

/** 배송 완료된 주문상품만 구매확정할 수 있다 (이미 확정이면 버튼 없음) */
export function canConfirmItem(item: OrderItem): boolean {
  return item.status === 'ORDERED' && item.deliveredAt !== null
}

/** 주문상품을 보내는 판매자의 배송 */
export function deliveryOf(order: Order, item: OrderItem) {
  return order.deliveries.find((delivery) => delivery.sellerId === item.sellerId) ?? null
}

/** 잔액 부족으로 취소된 주문이면 충전으로 안내한다 */
/** 구매할 수 없는 상품(재고 부족 · 판매 중지)으로 취소: 장바구니에 남아 있으니 다시 확인하게 한다 */
/** 주문상품의 구매 불가 표시. 이유가 없으면 null (표시 안 함) */
export function unavailableLabel(item: { unavailableReason: string | null }): string | null {
  if (!item.unavailableReason) return null
  return UNAVAILABLE_REASON_LABEL[item.unavailableReason] ?? '구매 불가'
}

/** 취소됐지만 담았던 상품이 장바구니에 그대로 있다 (BE: 결제 완료 뒤에만 뺀다) → 장바구니에서 다시 확인 */
export function needsCartReview(order: Order): boolean {
  return (
    order.status === 'CANCELLED' &&
    (order.cancelReason === 'OUT_OF_STOCK' || order.cancelReason === 'PAYMENT_EXPIRED')
  )
}

export type PaymentDeadline = {
  /** 마감 시각 "HH:MM" (서버 시각 그대로) */
  time: string
  /** 주문부터 마감까지 분. 서버 시각끼리 빼므로 시간대와 무관 */
  minutes: number | null
}

/** 결제 마감 (BE paymentDueAt). 모르면 null */
export function paymentDeadline(
  order: Pick<Order, 'orderedAt' | 'paymentDueAt'>,
): PaymentDeadline | null {
  if (!order.paymentDueAt) return null
  const due = parseServerTime(order.paymentDueAt)
  const ordered = parseServerTime(order.orderedAt)
  const minutes =
    Number.isNaN(due) || Number.isNaN(ordered) ? null : Math.round((due - ordered) / 60_000)
  return {
    time: order.paymentDueAt.slice(11, 16),
    minutes: minutes !== null && minutes > 0 ? minutes : null,
  }
}

/** 서버 시각 문자열(시간대 없음)을 같은 기준으로 읽는다 (두 값을 빼는 데만 쓴다) */
function parseServerTime(value: string): number {
  return Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`)
}

/** "10:10(주문 후 10분)" · 분을 모르면 "10:10" */
export function paymentDeadlineLabel(deadline: PaymentDeadline): string {
  return deadline.minutes ? `${deadline.time}(주문 후 ${deadline.minutes}분)` : deadline.time
}

export function needsCharge(order: Order): boolean {
  return order.status === 'CANCELLED' && order.cancelReason === 'PAYMENT_FAILED'
}

/** 주문 → 결제 → 배송 → 구매확정 상태 변화를 순서대로 */
export function buildOrderTimeline(order: Order): OrderTimelineEvent[] {
  const events: OrderTimelineEvent[] = [
    {
      at: order.orderedAt,
      label: '주문 저장 (결제대기)',
      note: 'order.created → 상품이 재고 차감',
    },
  ]
  if (order.status === 'PAID') {
    events.push({
      at: null,
      label: '결제 완료',
      note: 'stock.deducted → order.payment-requested → payment.completed',
    })
  }
  if (order.status === 'CANCELLED') {
    events.push({
      at: null,
      label: '주문 취소',
      note: order.cancelReason ? CANCEL_REASON_LABEL[order.cancelReason] : undefined,
    })
  }
  for (const delivery of order.deliveries) {
    if (delivery.shippedAt) {
      events.push({
        at: delivery.shippedAt,
        label: `판매자 ${delivery.sellerId} 발송`,
        note: `${carrierName(delivery.carrier)} ${delivery.trackingNumber ?? ''}`,
      })
    }
    if (delivery.deliveredAt) {
      events.push({ at: delivery.deliveredAt, label: `판매자 ${delivery.sellerId} 배송 완료` })
    }
  }
  for (const item of order.items) {
    if (item.confirmedAt) {
      events.push({
        at: item.confirmedAt,
        label: `${item.productName} 구매확정${item.confirmType === 'AUTO' ? ' (자동)' : ''}`,
        note: 'order-item.purchase-confirmed → 정산 대상 등록',
      })
    }
  }
  return events
}

const PROGRESS_STEPS = ['주문', '결제 완료', '배송 중', '배송 완료', '구매확정'] as const

/** 쇼핑 화면 진행 막대: 결제 → 판매자 한 곳이라도 발송 → 모두 배송 완료 → 모두 구매확정 */
export function orderProgress(order: Order): {
  steps: readonly string[]
  current: number
  cancelled: boolean
} {
  const result = (current: number, cancelled = false) => ({
    steps: PROGRESS_STEPS,
    current,
    cancelled,
  })
  if (order.status === 'CANCELLED') return result(0, true)
  if (order.status === 'PENDING_PAYMENT') return result(0)
  const { deliveries, items } = order
  if (items.length > 0 && items.every((item) => item.confirmedAt !== null)) return result(4)
  if (deliveries.length > 0 && deliveries.every((delivery) => delivery.deliveredAt !== null))
    return result(3)
  if (deliveries.some((delivery) => delivery.shippedAt !== null)) return result(2)
  return result(1)
}

/** 결제 처리 중이 이보다 길면 서버 이벤트(재고 차감 → 결제)가 오지 않는 것으로 본다 */
export const PAYMENT_DELAY_MS = 30_000

export function isPaymentDelayed(pendingMs: number): boolean {
  return pendingMs >= PAYMENT_DELAY_MS
}

/** 결제 처리 중 다시 조회 간격: 처음 30초는 1초, 그 뒤 10초 (흐름 기록이 조회로 덮이지 않게) */
export function paymentPollInterval(pendingMs: number): number {
  return isPaymentDelayed(pendingMs) ? 10_000 : 1_000
}

/** 주문 내역 탭: 전체 + 주문 상태별 */
export type OrderTab = 'ALL' | OrderStatus

export const ORDER_TABS: { value: OrderTab; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING_PAYMENT', label: '결제 처리 중' },
  { value: 'PAID', label: '결제 완료' },
  { value: 'CANCELLED', label: '취소' },
]

export function filterOrdersByTab<T extends { status: OrderStatus }>(
  orders: T[],
  tab: OrderTab,
): T[] {
  return tab === 'ALL' ? orders : orders.filter((order) => order.status === tab)
}

export function countOrdersByTab(orders: { status: OrderStatus }[]): Record<OrderTab, number> {
  const counts: Record<OrderTab, number> = {
    ALL: orders.length,
    PENDING_PAYMENT: 0,
    PAID: 0,
    CANCELLED: 0,
  }
  for (const order of orders) counts[order.status] += 1
  return counts
}

export type ProcessStepState = 'done' | 'active' | 'waiting' | 'failed' | 'skipped'

export type ProcessStep = {
  label: string
  /** 이 단계를 끝내는 서버 이벤트 (설계 기준) */
  event: string
  state: ProcessStepState
  /** 실패 · 보상 설명 */
  note?: string
}

/**
 * 주문하기 뒤 서버 처리 단계 (주문 접수 → 재고 확보 → 예치금 결제).
 * 응답에는 중간 단계가 없어서 결제대기면 "처리 중", 결과가 나오면 취소 사유로 멈춘 단계를 정한다
 */
export function orderProcess(order: Pick<Order, 'status' | 'cancelReason'>): ProcessStep[] {
  const step = (index: number, state: ProcessStepState, note?: string): ProcessStep => ({
    ...PROCESS[index],
    state,
    ...(note && { note }),
  })
  if (order.status === 'PAID') return [step(0, 'done'), step(1, 'done'), step(2, 'done')]
  if (order.status === 'PENDING_PAYMENT')
    return [step(0, 'done'), step(1, 'active'), step(2, 'waiting')]
  if (order.cancelReason === 'OUT_OF_STOCK')
    return [step(0, 'done'), step(1, 'failed', '구매할 수 없는 상품'), step(2, 'skipped')]
  if (order.cancelReason === 'PAYMENT_FAILED')
    return [step(0, 'done'), step(1, 'done', '재고 복구됨'), step(2, 'failed', '잔액 부족')]
  return [step(0, 'done'), step(1, 'skipped'), step(2, 'failed', '시간 초과')]
}

const PROCESS = [
  { label: '주문 접수', event: 'order.created' },
  { label: '재고 확보', event: 'stock.deducted' },
  { label: '예치금 결제', event: 'payment.completed' },
] as const
