import type { Order } from '@/entities/order'

/** 주문 상세가 바뀌면(결제 · 발송 · 배송 · 확정) 타임라인을 다시 부르기 위한 상태 글자 */
export function timelineRevision(order: Order): string {
  return [
    order.status,
    ...order.deliveries.map((delivery) => `${delivery.id}:${delivery.status}`),
    ...order.items.map((item) => `${item.id}:${item.status}`),
  ].join('|')
}
