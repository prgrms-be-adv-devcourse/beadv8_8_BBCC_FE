import { describe, expect, it } from 'vitest'
import { canBuyerCancel, type Order } from '@/entities/order'

const order = (
  status: Order['status'],
  deliveries: Order['deliveries'][number]['status'][] = [],
  items: Order['items'][number]['status'][] = ['ORDERED'],
) =>
  ({
    status,
    deliveries: deliveries.map((s) => ({ status: s })),
    items: items.map((s) => ({ status: s })),
  }) as unknown as Order

describe('구매자 발송 전 주문 취소 (BE #354)', () => {
  it('결제 처리 중이면 취소할 수 있다', () => {
    expect(canBuyerCancel(order('PENDING_PAYMENT'))).toBe(true)
  })
  it('결제 완료이고 모든 판매자가 발송 전이면 취소할 수 있다', () => {
    expect(canBuyerCancel(order('PAID', ['READY', 'READY']))).toBe(true)
    expect(canBuyerCancel(order('PAID', ['READY', 'CANCELLED'], ['ORDERED', 'CANCELLED']))).toBe(
      true,
    )
  })
  it('한 판매자라도 발송했으면 취소할 수 없다 — BE 409', () => {
    expect(canBuyerCancel(order('PAID', ['READY', 'SHIPPING']))).toBe(false)
    expect(canBuyerCancel(order('PAID', ['DELIVERED']))).toBe(false)
  })
  it('이미 취소된 주문, 상품이 모두 취소된 주문은 취소할 것이 없다', () => {
    expect(canBuyerCancel(order('CANCELLED'))).toBe(false)
    expect(canBuyerCancel(order('PAID', ['CANCELLED'], ['CANCELLED']))).toBe(false)
  })
})
