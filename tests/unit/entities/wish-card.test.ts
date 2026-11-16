import { describe, expect, it } from 'vitest'
import {
  childWishStatusLabel,
  filterWishes,
  wishSellersLabel,
  wishTotalAmount,
} from '@/entities/wish'

const item = (patch: {
  unitPrice?: number | null
  quantity?: number
  sellerName?: string | null
}) => ({
  unitPrice: patch.unitPrice === undefined ? 5500 : patch.unitPrice,
  quantity: patch.quantity ?? 1,
  sellerName: patch.sellerName === undefined ? '테스트상점' : patch.sellerName,
})

describe('조르기 카드 표시', () => {
  it('합계 = 단가 × 보낸 수량의 합 (단가 모르는 줄은 0)', () => {
    expect(
      wishTotalAmount({
        items: [item({}), item({ unitPrice: 8900, quantity: 2 }), item({ unitPrice: null })],
      }),
    ).toBe(5500 + 17800)
  })

  it('판매자: 겹치지 않게 나온 순서대로, 모르면 뺀다', () => {
    expect(
      wishSellersLabel({
        items: [item({}), item({ sellerName: '토닥키즈' }), item({}), item({ sellerName: null })],
      }),
    ).toBe('테스트상점 · 토닥키즈')
  })

  it('자녀에게 보이는 상태: 거절이면 이유도', () => {
    expect(childWishStatusLabel({ status: 'REQUESTED', rejectReason: null })).toBe('기다리는 중')
    expect(childWishStatusLabel({ status: 'PAID', rejectReason: null })).toBe('보호자가 사 줬어요')
    expect(childWishStatusLabel({ status: 'REJECTED', rejectReason: 'NEXT_TIME' })).toBe(
      '거절됨 · 다음에 사자',
    )
    expect(childWishStatusLabel({ status: 'REJECTED', rejectReason: null })).toBe('거절됨')
    expect(childWishStatusLabel({ status: 'CANCELLED', rejectReason: null })).toBe('철회함')
    expect(childWishStatusLabel({ status: 'EXPIRED', rejectReason: null })).toBe('기한 지남')
  })

  it('거르기: 기다리는 중 = 대기, 끝남 = 그 밖', () => {
    const wishes = [
      { status: 'REQUESTED' as const },
      { status: 'PAID' as const },
      { status: 'EXPIRED' as const },
    ]
    expect(filterWishes(wishes, 'ALL')).toHaveLength(3)
    expect(filterWishes(wishes, 'WAITING')).toEqual([{ status: 'REQUESTED' }])
    expect(filterWishes(wishes, 'DONE')).toEqual([{ status: 'PAID' }, { status: 'EXPIRED' }])
  })
})

describe('보호자 받은 조르기', () => {
  it('보호자에게 보이는 상태', async () => {
    const { guardianWishStatusLabel } = await import('@/entities/wish')
    expect(guardianWishStatusLabel({ status: 'REQUESTED' })).toBe('답을 기다려요')
    expect(guardianWishStatusLabel({ status: 'PAID' })).toBe('사 줬어요')
    expect(guardianWishStatusLabel({ status: 'REJECTED' })).toBe('거절함')
    expect(guardianWishStatusLabel({ status: 'CANCELLED' })).toBe('아이가 철회함')
    expect(guardianWishStatusLabel({ status: 'EXPIRED' })).toBe('기한 지남')
  })

  it('자녀로 거르기: 자녀를 안 고르면 모두', async () => {
    const { wishesOfChild } = await import('@/entities/wish')
    const wishes = [{ childId: '1' }, { childId: '2' }, { childId: '1' }]
    expect(wishesOfChild(wishes, null)).toHaveLength(3)
    expect(wishesOfChild(wishes, '1')).toEqual([{ childId: '1' }, { childId: '1' }])
  })
})
