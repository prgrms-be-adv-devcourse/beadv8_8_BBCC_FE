import type { NextShippingStep, SellerOrder } from './seller-order'

/** 발송 준비 → 발송(송장 등록), 배송 중 → 배송 완료, 배송 완료 → 할 일 없음 */
export function nextShippingStep(order: SellerOrder): NextShippingStep {
  if (order.status === 'READY') return 'SHIP'
  if (order.status === 'SHIPPING') return 'DELIVER'
  return null
}

export function validateTrackingNumber(trackingNumber: string): string | null {
  const value = trackingNumber.trim()
  if (!value) return '송장 번호를 입력해 주세요.'
  if (value.length > 50) return '송장 번호는 50자까지예요.'
  return null
}

/** 판매자 센터 첫 화면의 할 일: 발송할 것 · 배송 중 · 배송 완료 */
export function summarizeSellerOrders(orders: SellerOrder[]) {
  return {
    toShip: orders.filter((order) => order.status === 'READY').length,
    shipping: orders.filter((order) => order.status === 'SHIPPING').length,
    delivered: orders.filter((order) => order.status === 'DELIVERED').length,
  }
}

export type SellerOrderTab = 'READY' | 'SHIPPING' | 'DELIVERED' | 'ALL'

/** 주문 · 배송 탭 (할 일 먼저) */
export const SELLER_ORDER_TABS: { value: SellerOrderTab; label: string }[] = [
  { value: 'READY', label: '발송할 주문' },
  { value: 'SHIPPING', label: '배송 중' },
  { value: 'DELIVERED', label: '배송 완료' },
  { value: 'ALL', label: '전체' },
]

/** 주소의 ?tab= → 탭 (모르는 값 · 없음은 전체) */
export function sellerOrderTabOf(value: string | null): SellerOrderTab {
  return SELLER_ORDER_TABS.some((tab) => tab.value === value) ? (value as SellerOrderTab) : 'ALL'
}

export function filterSellerOrdersByTab(orders: SellerOrder[], tab: SellerOrderTab): SellerOrder[] {
  return tab === 'ALL' ? orders : orders.filter((order) => order.status === tab)
}

export function countSellerOrdersByTab(orders: SellerOrder[]): Record<SellerOrderTab, number> {
  const summary = summarizeSellerOrders(orders)
  return {
    READY: summary.toShip,
    SHIPPING: summary.shipping,
    DELIVERED: summary.delivered,
    ALL: orders.length,
  }
}

/** 일괄 처리: 고른 주문 중 같은 다음 처리(발송 · 배송 완료)인 것만 */
export function bulkTargets(orders: SellerOrder[], selectedIds: Set<string>) {
  const selected = orders.filter((order) => selectedIds.has(order.id))
  return {
    toShip: selected.filter((order) => nextShippingStep(order) === 'SHIP'),
    toDeliver: selected.filter((order) => nextShippingStep(order) === 'DELIVER'),
  }
}
