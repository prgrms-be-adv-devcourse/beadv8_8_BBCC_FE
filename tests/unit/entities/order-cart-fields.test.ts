import { describe, expect, it } from 'vitest'
import { groupBySeller, type CartLine } from '@/entities/cart'
import { CANCEL_REASON_LABEL, needsCartReview, orderTitle } from '@/entities/order'

describe('주문 목록 대표 상품 (BE #243 representativeProductName · itemCount)', () => {
  it('한 건이면 상품명만, 여러 건이면 "외 N건"', () => {
    expect(orderTitle('데일리 맨투맨', 1)).toBe('데일리 맨투맨')
    expect(orderTitle('데일리 맨투맨', 3)).toBe('데일리 맨투맨 외 2건')
  })
  it('상품명을 모르면 null (화면은 주문번호로)', () => {
    expect(orderTitle(null, 0)).toBeNull()
    expect(orderTitle('  ', 2)).toBeNull()
  })
})

describe('재고 차감 실패 취소 (안 1: cancelReason만)', () => {
  it('OUT_OF_STOCK = 재고 부족 · 판매 중지 모두 → 구매할 수 없는 상품 문구 · 장바구니 다시 확인', () => {
    expect(CANCEL_REASON_LABEL.OUT_OF_STOCK).toBe('구매할 수 없는 상품이 있어 주문이 취소됐어요.')
    const base = { status: 'CANCELLED', cancelReason: 'OUT_OF_STOCK' } as const
    expect(needsCartReview(base as never)).toBe(true)
    expect(needsCartReview({ ...base, cancelReason: 'PAYMENT_FAILED' } as never)).toBe(false)
    expect(needsCartReview({ status: 'PAID', cancelReason: null } as never)).toBe(false)
  })
})

describe('장바구니 판매자별 묶음 (BE #243 sellerId)', () => {
  const line = (id: string, sellerId: string | null): CartLine => ({
    id,
    optionId: id,
    productId: id,
    sellerId,
    productName: `상품 ${id}`,
    optionName: null,
    size: null,
    childId: null,
    quantity: 1,
    unitPrice: 1000,
    purchasable: sellerId !== null,
    lineAmount: 1000,
  })
  it('처음 나온 순서대로, 판매자를 모르는 줄은 맨 뒤 한 묶음', () => {
    const groups = groupBySeller([line('1', '2'), line('2', null), line('3', '5'), line('4', '2')])
    expect(groups.map((group) => [group.sellerId, group.lines.map((l) => l.id)])).toEqual([
      ['2', ['1', '4']],
      ['5', ['3']],
      [null, ['2']],
    ])
  })
})
