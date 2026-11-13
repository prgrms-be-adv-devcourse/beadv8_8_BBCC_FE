import { describe, expect, it } from 'vitest'
import {
  bulkTargets,
  sellerOrderStatusOfTab,
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
  // BE #1280: 판매 주문 status는 배송 상태 하나(READY · SHIPPING · DELIVERED · CANCELLED). 전체는 보내지 않는다
  it('탭 → 목록 API status (전체는 null)', () => {
    expect(sellerOrderStatusOfTab('ALL')).toBeNull()
    expect(sellerOrderStatusOfTab('READY')).toBe('READY')
    expect(sellerOrderStatusOfTab('SHIPPING')).toBe('SHIPPING')
    expect(sellerOrderStatusOfTab('DELIVERED')).toBe('DELIVERED')
    expect(sellerOrderStatusOfTab('CANCELLED')).toBe('CANCELLED')
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
