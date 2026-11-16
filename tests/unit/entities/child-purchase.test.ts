import { describe, expect, it } from 'vitest'
import { childPurchaseSourceOf, childPurchaseStatusLabel, toChildPurchase } from '@/entities/order'
import { validate } from '@/shared/api/contract'
import { childPurchasePageShape } from '@/entities/order/api/order.shape'

// BE ChildPurchaseController GET /orders/items/mine (#1000) 한 줄
const row = {
  orderItemId: '41',
  orderedAt: '2026-11-12T10:00:00',
  productId: '7',
  productName: '데일리 맨투맨',
  optionName: '네이비 / 110',
  quantity: 1,
  status: 'SHIPPING',
}

describe('나를 위해 산 상품 (BE #1000)', () => {
  it('계약 모양 · 매퍼', () => {
    const page = {
      content: [row],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
    }
    expect(validate(page, childPurchasePageShape)).toEqual([])
    expect(toChildPurchase(row)).toEqual({
      id: '41',
      orderedAt: '2026-11-12T10:00:00',
      productId: '7',
      productName: '데일리 맨투맨',
      optionName: '네이비 / 110',
      quantity: 1,
      status: 'SHIPPING',
      // BE #1328 전 응답(사진 칸 없음)은 null
      thumbnailUrl: null,
    })
  })
  it('상품 정보가 없으면 판매가 끝난 상품', () => {
    expect(toChildPurchase({ ...row, productName: null }).productName).toBe('판매가 끝난 상품')
  })
  it.each([
    ['PAID', '결제 완료'],
    ['SHIPPING', '배송 중'],
    ['DELIVERED', '배송 완료'],
    ['CONFIRMED', '구매확정'],
    ['CANCELLED', '취소됨'],
    ['NEW_STATUS', 'NEW_STATUS'],
  ])('상태 %s → %s', (status, label) => {
    expect(childPurchaseStatusLabel(status)).toBe(label)
  })
  it('출처: 내 조르기의 결제된 주문상품이면 조르기로 산 것, 아니면 보호자가 산 것', () => {
    const wishes = [{ paidOrderItemIds: ['40', '41'] }, { paidOrderItemIds: [] }]
    expect(childPurchaseSourceOf('41', wishes)).toBe('조르기로 산 것')
    expect(childPurchaseSourceOf('99', wishes)).toBe('보호자가 산 것')
  })
})
