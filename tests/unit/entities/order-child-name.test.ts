import { describe, expect, it } from 'vitest'
import { toOrder } from '@/entities/order'
import { orderDetailShape } from '@/entities/order/api/order.shape'
import { sellerOrderPageShape } from '@/entities/seller-order/api/seller-order.shape'
import { toSellerOrder } from '@/entities/seller-order/model/seller-order.mapper'
import { validate } from '@/shared/api/contract'

// 주문 계약: 자녀 이름은 null일 수 있다 (회원의 자녀 변경 이벤트에 이름이 없음)
const item = {
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
  unavailableReason: null,
  sellerName: null,
  child: { childId: '1', name: null, heightCm: 115, weightKg: 20, bodyType: 'NORMAL' },
}
const address = {
  recipientName: '홍길동',
  phone: '010-0000-0000',
  zipCode: '04524',
  address: '서울시 테스트로 1',
}
const order = {
  orderId: '6',
  status: 'PAID',
  cancelReason: null,
  totalAmount: 25000,
  orderedAt: '2026-10-14T10:00:00',
  paymentDueAt: null,
  shippingAddress: address,
  items: [item],
  deliveries: [],
}
const sellerOrder = {
  sellerOrderId: '8',
  orderId: '6',
  status: 'READY',
  carrier: null,
  trackingNumber: null,
  shippedAt: null,
  deliveredAt: null,
  orderedAt: '2026-10-14T10:00:00',
  shippingAddress: address,
  items: [item],
}
const page = (content: unknown[]) => ({
  content,
  page: 0,
  size: 20,
  totalElements: content.length,
  totalPages: 1,
  hasNext: false,
})

describe('주문 계약: 자녀 이름 null · 판매 주문 상품 필드', () => {
  it('주문 상세(POST /orders 응답 포함)는 자녀 이름 null을 계약 위반으로 보지 않는다', () => {
    expect(validate(order, orderDetailShape)).toEqual([])
    expect(toOrder(order as never).items[0].child).toMatchObject({ name: null, heightCm: 115 })
  })

  it('빈 자녀 이름도 null로 다룬다', () => {
    const blank = { ...order, items: [{ ...item, child: { ...item.child, name: '  ' } }] }
    expect(toOrder(blank as never).items[0].child?.name).toBeNull()
  })

  it('판매 주문: unavailableReason · sellerName이 계약에 있고 자녀 이름 null도 통과', () => {
    const issues = validate(page([sellerOrder]), sellerOrderPageShape)
    expect(issues.filter((issue) => issue.type !== 'extra')).toEqual([])
    expect(issues.map((issue) => issue.path)).not.toContain('content[0].items[0].unavailableReason')
    expect(issues.map((issue) => issue.path)).not.toContain('content[0].items[0].sellerName')
  })

  it('판매 주문: 자녀 이름이 없으면 "자녀(키)"로 표시', () => {
    expect(toSellerOrder(sellerOrder as never).items[0].childLabel).toBe('자녀(115cm)')
    const named = { ...sellerOrder, items: [{ ...item, child: { ...item.child, name: '하나' } }] }
    expect(toSellerOrder(named as never).items[0].childLabel).toBe('하나(115cm)')
  })
})
