import { carrierName } from '@/shared/config'
import { CANCEL_REASON_LABEL, type Order, type OrderItem, type OrderTimelineEvent } from './order'

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
