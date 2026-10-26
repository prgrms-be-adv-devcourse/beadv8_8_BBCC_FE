import { describe, expect, it } from 'vitest'
import { orderSellerGroups, type Order, type OrderDelivery, type OrderItem } from '@/entities/order'

const item = (id: string, sellerId: string, sellerName: string | null): OrderItem => ({
  id,
  productId: '1',
  optionId: id,
  sellerId,
  productName: `상품 ${id}`,
  optionName: null,
  size: null,
  unitPrice: 1000,
  quantity: 1,
  amount: 1000,
  status: 'ORDERED',
  deliveredAt: null,
  confirmedAt: null,
  confirmType: null,
  unavailableReason: null,
  sellerName,
  child: null,
})

const delivery = (id: string, sellerId: string, sellerName: string | null): OrderDelivery => ({
  id,
  sellerId,
  sellerName,
  status: 'SHIPPING',
  carrier: 'CJ',
  trackingNumber: '123',
  shippedAt: null,
  deliveredAt: null,
})

const order = (items: OrderItem[], deliveries: OrderDelivery[]): Order => ({
  id: '1',
  status: 'PAID',
  cancelReason: null,
  totalAmount: 0,
  orderedAt: '2026-10-20T10:00:00',
  paymentDueAt: null,
  shippingAddress: { recipientName: '보호자', phone: '010', zipCode: '0', address: '서울' },
  items,
  deliveries,
})

describe('주문 상품을 판매자별로 묶는다 (판매자마다 배송이 하나)', () => {
  it('처음 나온 판매자 순서대로, 그 판매자의 배송을 붙인다', () => {
    const groups = orderSellerGroups(
      order(
        [item('1', 'A', '가게A'), item('2', 'B', '가게B'), item('3', 'A', '가게A')],
        [delivery('9', 'B', '가게B')],
      ),
    )
    expect(groups.map((group) => [group.sellerId, group.items.map((x) => x.id)])).toEqual([
      ['A', ['1', '3']],
      ['B', ['2']],
    ])
    expect(groups[0].delivery).toBeNull()
    expect(groups[1].delivery?.id).toBe('9')
  })

  it('상호명은 주문상품 → 배송 → 「판매자 {ID}」 순서로 찾는다', () => {
    const groups = orderSellerGroups(
      order([item('1', 'A', null), item('2', 'B', null)], [delivery('9', 'B', '가게B')]),
    )
    expect(groups.map((group) => group.sellerName)).toEqual(['판매자 A', '가게B'])
  })
})
