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
