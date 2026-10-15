import { describe, expect, it } from 'vitest'
import {
  countOrdersByTab,
  filterOrdersByTab,
  ORDER_TABS,
  type OrderSummary,
} from '@/entities/order'

const order = (id: string, status: OrderSummary['status']): OrderSummary => ({
  id,
  status,
  totalAmount: 25000,
  title: null,
  orderedAt: '2026-10-15T10:00:00',
})
const orders = [
  order('1', 'PAID'),
  order('2', 'PENDING_PAYMENT'),
  order('3', 'CANCELLED'),
  order('4', 'PAID'),
]

describe('주문 내역 상태 탭', () => {
  it('탭 순서: 전체 · 결제 처리 중 · 결제 완료 · 취소', () => {
    expect(ORDER_TABS.map((tab) => tab.label)).toEqual([
      '전체',
      '결제 처리 중',
      '결제 완료',
      '취소',
    ])
  })

  it('탭에 맞는 주문만 (순서 유지)', () => {
    expect(filterOrdersByTab(orders, 'ALL').map((item) => item.id)).toEqual(['1', '2', '3', '4'])
    expect(filterOrdersByTab(orders, 'PAID').map((item) => item.id)).toEqual(['1', '4'])
    expect(filterOrdersByTab(orders, 'PENDING_PAYMENT').map((item) => item.id)).toEqual(['2'])
    expect(filterOrdersByTab(orders, 'CANCELLED').map((item) => item.id)).toEqual(['3'])
  })

  it('탭별 개수', () => {
    expect(countOrdersByTab(orders)).toEqual({ ALL: 4, PENDING_PAYMENT: 1, PAID: 2, CANCELLED: 1 })
    expect(countOrdersByTab([])).toEqual({ ALL: 0, PENDING_PAYMENT: 0, PAID: 0, CANCELLED: 0 })
  })
})
