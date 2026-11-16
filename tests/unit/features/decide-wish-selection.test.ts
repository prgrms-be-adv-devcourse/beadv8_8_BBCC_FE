import { describe, expect, it } from 'vitest'
import { approvedOptionIds, wishOrderTotal } from '@/features/decide-wish'

// 보호자 답하기: 바로 결제할 수 있는 줄은 처음부터 모두 고른 상태, 뺀 줄만 빠진다
describe('조르기 승인할 줄 고르기', () => {
  const item = (
    optionId: string,
    patch: { cartItemId?: string | null; purchasable?: boolean; unitPrice?: number | null } = {},
  ) => ({
    optionId,
    cartItemId: patch.cartItemId === undefined ? `c${optionId}` : patch.cartItemId,
    purchasable: patch.purchasable ?? true,
    unitPrice: patch.unitPrice === undefined ? 1000 : patch.unitPrice,
  })
  const items = [
    item('1'),
    item('2'),
    item('3', { purchasable: false }),
    item('4', { cartItemId: null }),
    item('5', { unitPrice: null }),
  ]

  it('뺀 줄이 없으면 결제할 수 있는 줄 전부', () => {
    expect(approvedOptionIds(items, [])).toEqual(['1', '2'])
  })

  it('뺀 줄은 빠진다', () => {
    expect(approvedOptionIds(items, ['1'])).toEqual(['2'])
  })

  it('합계 = 단가 × 주문 수량', () => {
    expect(
      wishOrderTotal([
        { unitPrice: 5500, quantity: 1 },
        { unitPrice: 8900, quantity: 2 },
        { unitPrice: null, quantity: 1 },
      ]),
    ).toBe(23300)
  })
})
