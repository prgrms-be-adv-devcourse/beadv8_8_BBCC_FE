import { describe, expect, it } from 'vitest'
import { summarizeSellerOrders, type SellerOrder } from '@/entities/seller-order'

const so = (id: string, status: SellerOrder['status']): SellerOrder => ({
  id,
  orderId: id,
  status,
  carrier: null,
  trackingNumber: null,
  orderedAt: '2026-10-14T10:00:00',
  recipientName: '홍',
  address: '서울',
  items: [],
})

describe('summarizeSellerOrders: 판매자 센터 할 일 집계', () => {
  it('빈 목록이면 모두 0', () => {
    expect(summarizeSellerOrders([])).toEqual({ toShip: 0, shipping: 0, delivered: 0 })
  })

  it('발송 준비 · 배송 중 · 배송 완료를 센다', () => {
    const orders = [so('1', 'READY'), so('2', 'READY'), so('3', 'SHIPPING'), so('4', 'DELIVERED')]
    expect(summarizeSellerOrders(orders)).toEqual({ toShip: 2, shipping: 1, delivered: 1 })
  })
})
