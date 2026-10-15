import { describe, expect, it } from 'vitest'
import {
  buildOrderTimeline,
  canConfirmItem,
  deliveryOf,
  needsCharge,
  toOrder,
  toPlaceOrderRequest,
  type OrderItem,
} from '@/entities/order'

const dto = {
  orderId: '6',
  status: 'PAID',
  cancelReason: null,
  totalAmount: 25000,
  orderedAt: '2026-10-14T10:00:00',
  paymentDueAt: '2026-10-14T10:10:00',
  shippingAddress: {
    recipientName: '홍길동',
    phone: '010-0000-0000',
    zipCode: '04524',
    address: '서울시 테스트로 1',
  },
  items: [
    {
      orderItemId: '7',
      productId: '1',
      optionId: '2',
      sellerId: '2',
      productName: '데일리 맨투맨',
      optionName: '네이비 / 120',
      size: '120',
      unitPrice: 25000,
      quantity: 1,
      amount: 25000,
      status: 'ORDERED',
      deliveredAt: null,
      confirmedAt: null,
      confirmType: null,
      child: { childId: '1', name: '테스트', heightCm: 115, weightKg: 20, bodyType: 'NORMAL' },
    },
  ],
  deliveries: [
    {
      sellerOrderId: '8',
      sellerId: '2',
      status: 'READY',
      carrier: null,
      trackingNumber: null,
      shippedAt: null,
      deliveredAt: null,
    },
  ],
}

const item = (patch: Partial<OrderItem>): OrderItem => ({ ...toOrder(dto).items[0], ...patch })

describe('주문 매퍼', () => {
  it('응답 ID를 모델 id로 옮기고 주문 당시 자녀 정보를 남긴다', () => {
    const order = toOrder(dto)
    expect(order.id).toBe('6')
    expect(order.items[0].id).toBe('7')
    expect(order.items[0].child).toEqual({ id: '1', name: '테스트', heightCm: 115, weightKg: 20 })
    expect(order.deliveries[0].id).toBe('8')
  })

  it('주문하기 요청은 옵션 · 자녀 ID를 숫자로, 자녀가 없으면 null로 보낸다', () => {
    const request = toPlaceOrderRequest({
      items: [
        { optionId: '2', childId: '1', quantity: 1, unitPrice: 25000 },
        { optionId: '3', childId: null, quantity: 2, unitPrice: 30000 },
      ],
      shippingAddress: dto.shippingAddress,
    })
    expect(request.items).toEqual([
      { optionId: 2, childId: 1, quantity: 1, unitPrice: 25000 },
      { optionId: 3, childId: null, quantity: 2, unitPrice: 30000 },
    ])
  })
})

describe('구매확정 가능 여부', () => {
  it('배송 완료 전이면 확정할 수 없다', () => {
    expect(canConfirmItem(item({ deliveredAt: null }))).toBe(false)
  })
  it('배송 완료된 주문상품은 확정할 수 있다', () => {
    expect(canConfirmItem(item({ deliveredAt: '2026-10-15T10:00:00' }))).toBe(true)
  })
  it('이미 확정된 주문상품은 버튼이 없다', () => {
    expect(canConfirmItem(item({ deliveredAt: '2026-10-15T10:00:00', status: 'CONFIRMED' }))).toBe(
      false,
    )
  })
})

describe('주문 규칙', () => {
  it('주문상품의 판매자 배송을 찾는다', () => {
    const order = toOrder(dto)
    expect(deliveryOf(order, order.items[0])?.id).toBe('8')
  })

  it('잔액 부족으로 취소된 주문만 충전으로 안내한다', () => {
    expect(
      needsCharge(toOrder({ ...dto, status: 'CANCELLED', cancelReason: 'PAYMENT_FAILED' })),
    ).toBe(true)
    expect(
      needsCharge(toOrder({ ...dto, status: 'CANCELLED', cancelReason: 'PAYMENT_EXPIRED' })),
    ).toBe(false)
    expect(needsCharge(toOrder(dto))).toBe(false)
  })

  it('상태 변화: 결제 완료 → 발송 → 배송 완료 → 구매확정 순서로 쌓인다', () => {
    const order = toOrder({
      ...dto,
      items: [
        {
          ...dto.items[0],
          status: 'CONFIRMED',
          confirmedAt: '2026-10-16T10:00:00',
          confirmType: 'DIRECT',
        },
      ],
      deliveries: [
        {
          ...dto.deliveries[0],
          status: 'DELIVERED',
          carrier: 'CJ',
          trackingNumber: '123',
          shippedAt: '2026-10-14T11:00:00',
          deliveredAt: '2026-10-15T10:00:00',
        },
      ],
    })
    expect(buildOrderTimeline(order).map((event) => event.label)).toEqual([
      '주문 저장 (결제대기)',
      '결제 완료',
      '판매자 2 발송',
      '판매자 2 배송 완료',
      '데일리 맨투맨 구매확정',
    ])
  })

  it('상태 변화: 취소된 주문은 취소 사유를 남긴다', () => {
    const events = buildOrderTimeline(
      toOrder({ ...dto, status: 'CANCELLED', cancelReason: 'OUT_OF_STOCK' }),
    )
    expect(events.at(-1)).toMatchObject({ label: '주문 취소', note: '재고가 부족해요' })
  })
})
