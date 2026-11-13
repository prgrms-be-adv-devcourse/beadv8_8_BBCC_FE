import type { DeliveryStatus } from '@/shared/config'
import type { NextShippingStep, SellerOrder } from './seller-order'

/** 발송 준비 → 발송(송장 등록), 배송 중 → 배송 완료, 배송 완료 · 취소 → 할 일 없음 */
export function nextShippingStep(order: SellerOrder): NextShippingStep {
  if (order.status === 'READY') return 'SHIP'
  if (order.status === 'SHIPPING') return 'DELIVER'
  return null
}

/** 판매자 발송 전 취소는 발송 준비(READY)일 때만 (BE #655, 그 밖은 409) */
export function canCancelSellerOrder(order: Pick<SellerOrder, 'status'>): boolean {
  return order.status === 'READY'
}

export function validateTrackingNumber(trackingNumber: string): string | null {
  const value = trackingNumber.trim()
  if (!value) return '송장 번호를 입력해 주세요.'
  if (value.length > 50) return '송장 번호는 50자까지예요.'
  return null
}

export type SellerOrderTab = 'READY' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'ALL'

/** 주문 · 배송 탭 (할 일 먼저) */
export const SELLER_ORDER_TABS: { value: SellerOrderTab; label: string }[] = [
  { value: 'READY', label: '발송할 주문' },
  { value: 'SHIPPING', label: '배송 중' },
  { value: 'DELIVERED', label: '배송 완료' },
  /** 발송 전 취소로 그 판매자 몫이 모두 취소된 배송 */
  { value: 'CANCELLED', label: '취소' },
  { value: 'ALL', label: '전체' },
]

/** 주소의 ?tab= → 탭 (모르는 값 · 없음은 전체) */
export function sellerOrderTabOf(value: string | null): SellerOrderTab {
  return SELLER_ORDER_TABS.some((tab) => tab.value === value) ? (value as SellerOrderTab) : 'ALL'
}

/** 탭 → 목록 API status (BE #1280: 배송 상태 하나). 전체는 null = status를 보내지 않는다 */
export function sellerOrderStatusOfTab(tab: SellerOrderTab): DeliveryStatus | null {
  return tab === 'ALL' ? null : tab
}

/** 일괄 처리: 고른 주문 중 같은 다음 처리(발송 · 배송 완료)인 것만 */
export function bulkTargets(orders: SellerOrder[], selectedIds: Set<string>) {
  const selected = orders.filter((order) => selectedIds.has(order.id))
  return {
    toShip: selected.filter((order) => nextShippingStep(order) === 'SHIP'),
    toDeliver: selected.filter((order) => nextShippingStep(order) === 'DELIVER'),
  }
}
