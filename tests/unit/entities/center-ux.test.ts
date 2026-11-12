import { describe, expect, it } from 'vitest'
import {
  bulkTargets,
  countSellerOrdersByTab,
  filterSellerOrdersByTab,
  sellerOrderTabOf,
  type SellerOrder,
} from '@/entities/seller-order'

const order = (id: string, status: SellerOrder['status']): SellerOrder => ({
  id,
  orderId: id,
  status,
  carrier: null,
  trackingNumber: null,
  orderedAt: '2026-10-16T12:00:00',
  recipientName: '가',
  address: '서울',
  items: [],
})
const orders = [
  order('1', 'READY'),
  order('2', 'READY'),
  order('3', 'SHIPPING'),
  order('4', 'DELIVERED'),
]

describe('판매자 주문 탭', () => {
  it('탭별 건수 · 거르기', () => {
    expect(countSellerOrdersByTab(orders)).toEqual({ READY: 2, SHIPPING: 1, DELIVERED: 1, ALL: 4 })
    expect(countSellerOrdersByTab(orders, 107)).toEqual({
      READY: 2,
      SHIPPING: 1,
      DELIVERED: 1,
      ALL: 107,
    })
    expect(filterSellerOrdersByTab(orders, 'READY').map((o) => o.id)).toEqual(['1', '2'])
    expect(filterSellerOrdersByTab(orders, 'ALL')).toHaveLength(4)
  })
  it('?tab= 값 (모르면 전체)', () => {
    expect(sellerOrderTabOf('SHIPPING')).toBe('SHIPPING')
    expect(sellerOrderTabOf(null)).toBe('ALL')
    expect(sellerOrderTabOf('PAID')).toBe('ALL')
  })
  it('일괄 처리 대상: 고른 것 중 다음 처리가 같은 것만', () => {
    const targets = bulkTargets(orders, new Set(['1', '3', '4']))
    expect(targets.toShip.map((o) => o.id)).toEqual(['1'])
    expect(targets.toDeliver.map((o) => o.id)).toEqual(['3'])
  })
})
