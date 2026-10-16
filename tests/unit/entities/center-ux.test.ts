import { describe, expect, it } from 'vitest'
import { filterSellerProducts, stockLevelOf } from '@/entities/product'
import {
  bulkTargets,
  countSellerOrdersByTab,
  filterSellerOrdersByTab,
  sellerOrderTabOf,
  type SellerOrder,
} from '@/entities/seller-order'
import { sumSettlementItems } from '@/entities/settlement'

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

describe('재고 수준 (경계: 0 · 5 · 6)', () => {
  it('0 품절 · 5 이하 적음 · 6 충분', () => {
    expect(stockLevelOf(0)).toBe('OUT')
    expect(stockLevelOf(1)).toBe('LOW')
    expect(stockLevelOf(5)).toBe('LOW')
    expect(stockLevelOf(6)).toBe('OK')
  })
  it('판매자 상품 거르기: 이름 · 재고 적은 것만', () => {
    const products = [
      { name: '데일리 맨투맨', totalStock: 20 },
      { name: '밴딩 조거 팬츠', totalStock: 5 },
      { name: '후드 집업', totalStock: 0 },
    ]
    expect(filterSellerProducts(products, { keyword: ' 조거', lowStockOnly: false })).toHaveLength(
      1,
    )
    expect(
      filterSellerProducts(products, { keyword: '', lowStockOnly: true }).map((p) => p.name),
    ).toEqual(['밴딩 조거 팬츠', '후드 집업'])
  })
})

describe('정산 예정 금액', () => {
  it('구매확정분 판매 금액 합', () => {
    expect(sumSettlementItems([])).toBe(0)
    expect(
      sumSettlementItems([
        { orderItemId: '1', orderId: '1', amount: 25000, confirmedAt: '' },
        { orderItemId: '2', orderId: '1', amount: 30000, confirmedAt: '' },
      ]),
    ).toBe(55000)
  })
})
