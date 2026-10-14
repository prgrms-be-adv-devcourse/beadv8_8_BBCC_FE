import { describe, expect, it } from 'vitest'
import { orderProgress, type Order, type OrderDelivery, type OrderItem } from '@/entities/order'

const item = (over: Partial<OrderItem> = {}): OrderItem => ({
  id: '1',
  productId: '1',
  optionId: '1',
  sellerId: '2',
  productName: '맨투맨',
  size: '120',
  unitPrice: 1000,
  quantity: 1,
  amount: 1000,
  status: 'ORDERED',
  deliveredAt: null,
  confirmedAt: null,
  confirmType: null,
  child: null,
  ...over,
})
const delivery = (over: Partial<OrderDelivery> = {}): OrderDelivery => ({
  id: '1',
  sellerId: '2',
  status: 'READY',
  carrier: null,
  trackingNumber: null,
  shippedAt: null,
  deliveredAt: null,
  ...over,
})
const order = (over: Partial<Order> = {}): Order => ({
  id: '1',
  status: 'PAID',
  cancelReason: null,
  totalAmount: 1000,
  orderedAt: '2026-10-14T10:00:00',
  shippingAddress: { recipientName: '홍', phone: '010', zipCode: '1', address: '서울' },
  items: [item()],
  deliveries: [delivery()],
  ...over,
})

const SHIPPED = { status: 'SHIPPING' as const, shippedAt: '2026-10-14T11:00:00' }
const DELIVERED = {
  status: 'DELIVERED' as const,
  shippedAt: '2026-10-14T11:00:00',
  deliveredAt: '2026-10-14T12:00:00',
}

describe('orderProgress: 주문 진행 단계 (주문 → 결제 완료 → 배송 중 → 배송 완료 → 구매확정)', () => {
  it('단계 이름은 5개, 순서 고정', () => {
    expect(orderProgress(order()).steps).toEqual([
      '주문',
      '결제 완료',
      '배송 중',
      '배송 완료',
      '구매확정',
    ])
  })

  it('결제 처리 중이면 0단계', () => {
    expect(orderProgress(order({ status: 'PENDING_PAYMENT' }))).toMatchObject({
      current: 0,
      cancelled: false,
    })
  })

  it('결제 완료 · 발송 전이면 1단계', () => {
    expect(orderProgress(order()).current).toBe(1)
  })

  it('판매자 중 한 곳이라도 발송하면 2단계', () => {
    const o = order({ deliveries: [delivery(SHIPPED), delivery({ id: '2', sellerId: '3' })] })
    expect(orderProgress(o).current).toBe(2)
  })

  it('모든 판매자가 배송 완료해야 3단계 (일부만 완료면 2단계)', () => {
    const partial = order({
      deliveries: [delivery(DELIVERED), delivery({ id: '2', sellerId: '3', ...SHIPPED })],
    })
    expect(orderProgress(partial).current).toBe(2)
    expect(orderProgress(order({ deliveries: [delivery(DELIVERED)] })).current).toBe(3)
  })

  it('모든 주문상품을 구매확정해야 4단계 (하나라도 남으면 3단계)', () => {
    const confirmed = item({ status: 'CONFIRMED', confirmedAt: '2026-10-14T13:00:00' })
    const half = order({
      deliveries: [delivery(DELIVERED)],
      items: [confirmed, item({ id: '2' })],
    })
    expect(orderProgress(half).current).toBe(3)
    expect(
      orderProgress(order({ deliveries: [delivery(DELIVERED)], items: [confirmed] })).current,
    ).toBe(4)
  })

  it('배송 정보가 아직 없으면(결제 직후) 1단계에 머문다', () => {
    expect(orderProgress(order({ deliveries: [] })).current).toBe(1)
  })

  it('취소된 주문은 cancelled로 표시하고 0단계', () => {
    expect(
      orderProgress(order({ status: 'CANCELLED', cancelReason: 'PAYMENT_FAILED' })),
    ).toMatchObject({ current: 0, cancelled: true })
  })
})
