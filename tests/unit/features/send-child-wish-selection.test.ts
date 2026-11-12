import { describe, expect, it } from 'vitest'
import { selectedWishIds, wishSelectionTotal } from '@/features/send-child-wish'

// 처음부터 보낼 수 있는 줄은 모두 고른 상태: 사용자가 뺀 줄(excluded)만 빠진다
describe('자녀 조르기 보낼 줄 고르기', () => {
  const line = (
    id: string,
    change: { purchasable?: boolean; reserved?: boolean; amount?: number },
  ) => ({
    id,
    purchasable: change.purchasable ?? true,
    reserved: change.reserved ?? false,
    lineAmount: change.amount ?? 1000,
  })
  const items = [
    line('1', { amount: 5500 }),
    line('2', { amount: 8900 }),
    line('3', { reserved: true }),
    line('4', { purchasable: false }),
  ]

  it('뺀 줄이 없으면 보낼 수 있는 줄 전부', () => {
    expect(selectedWishIds(items, [])).toEqual(['1', '2'])
  })

  it('뺀 줄은 빠지고, 예약 · 판매 끝난 줄은 처음부터 빠진다', () => {
    expect(selectedWishIds(items, ['2'])).toEqual(['1'])
    expect(selectedWishIds(items, ['1', '2'])).toEqual([])
  })

  it('고른 줄 금액 합계', () => {
    expect(wishSelectionTotal(items, ['1', '2'])).toBe(14400)
    expect(wishSelectionTotal(items, [])).toBe(0)
  })
})
