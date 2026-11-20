import { describe, expect, it } from 'vitest'
import {
  CHILD_WISH_FILTER_LABEL,
  CHILD_WISH_FILTERS,
  childWishDateLine,
  childWishStatusLabel,
  filterChildWishes,
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

  it('자녀에게 보이는 상태 도장 (거절 이유는 보호자 답으로 따로 보인다)', () => {
    expect(childWishStatusLabel({ status: 'REQUESTED' })).toBe('기다리는 중')
    expect(childWishStatusLabel({ status: 'PAID' })).toBe('사 줬어!')
    expect(childWishStatusLabel({ status: 'REJECTED' })).toBe('다음에')
    expect(childWishStatusLabel({ status: 'CANCELLED' })).toBe('거뒀어')
    expect(childWishStatusLabel({ status: 'EXPIRED' })).toBe('기한 지남')
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

  it('자녀 거르기: 전체 또는 상태 하나', () => {
    const wishes = [
      { status: 'REQUESTED' as const },
      { status: 'PAID' as const },
      { status: 'REJECTED' as const },
      { status: 'PAID' as const },
    ]
    expect(CHILD_WISH_FILTERS).toEqual([
      'ALL',
      'REQUESTED',
      'PAID',
      'REJECTED',
      'EXPIRED',
      'CANCELLED',
    ])
    expect(filterChildWishes(wishes, 'ALL')).toHaveLength(4)
    expect(filterChildWishes(wishes, 'PAID')).toEqual([{ status: 'PAID' }, { status: 'PAID' }])
    expect(filterChildWishes(wishes, 'EXPIRED')).toEqual([])
    expect(CHILD_WISH_FILTER_LABEL.PAID).toBe('사 줬어')
  })
})

describe('childWishDateLine: 자녀 조르기 카드의 날짜 줄 (월.일)', () => {
  const at = { requestedAt: '2026-11-12T10:00:00', decidedAt: null, expiredAt: null }
  it('대기는 보낸 날만', () => {
    expect(childWishDateLine({ ...at, status: 'REQUESTED' })).toBe('11.12 보냄')
  })
  it('처리되면 처리한 날과 결과', () => {
    const decidedAt = '2026-11-13T09:00:00'
    expect(childWishDateLine({ ...at, status: 'PAID', decidedAt })).toBe('11.12 보냄 · 11.13 결제')
    expect(childWishDateLine({ ...at, status: 'REJECTED', decidedAt })).toBe(
      '11.12 보냄 · 11.13 거절',
    )
    expect(childWishDateLine({ ...at, status: 'CANCELLED', decidedAt })).toBe(
      '11.12 보냄 · 11.13 거둠',
    )
    expect(childWishDateLine({ ...at, status: 'EXPIRED', expiredAt: '2026-11-19T10:00:00' })).toBe(
      '11.12 보냄 · 11.19 끝남',
    )
  })
  it('처리 시각을 모르면 보낸 날만', () => {
    expect(childWishDateLine({ ...at, status: 'PAID' })).toBe('11.12 보냄')
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
