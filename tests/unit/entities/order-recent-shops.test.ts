import { describe, expect, it } from 'vitest'
import { recentShopsOf, type OrderSummary } from '@/entities/order'

function order(patch: Partial<OrderSummary>): OrderSummary {
  return {
    id: 'o1',
    status: 'PAID',
    totalAmount: 10000,
    orderedAt: '2026-11-01T10:00:00',
    title: '맨투맨',
    sellerName: '무무즈',
    productId: 'p1',
    thumbnailUrl: null,
    ...patch,
  }
}

describe('최근에 산 상점', () => {
  it('상점마다 주문 수를 세어 많이 산 순서로 준다', () => {
    const shops = recentShopsOf([
      order({ id: 'o3', sellerName: '코코리본', thumbnailUrl: 'c.jpg' }),
      order({ id: 'o2', sellerName: '무무즈', thumbnailUrl: 'm2.jpg' }),
      order({ id: 'o1', sellerName: '무무즈', thumbnailUrl: 'm1.jpg' }),
    ])
    expect(shops).toEqual([
      { name: '무무즈', orderCount: 2, thumbnailUrl: 'm2.jpg' },
      { name: '코코리본', orderCount: 1, thumbnailUrl: 'c.jpg' },
    ])
  })

  // 결제하지 않았거나 취소된 주문은 산 것이 아니다. 상점 이름을 모르는 주문은 셀 수 없다
  it.each([
    ['취소된 주문', { status: 'CANCELLED' }],
    ['결제 처리 중인 주문', { status: 'PENDING_PAYMENT' }],
    ['상점 이름을 모르는 주문', { sellerName: null }],
  ] as const)('%s은 세지 않는다', (_label, patch) => {
    expect(recentShopsOf([order(patch)])).toEqual([])
  })

  it('가장 많이 산 상점부터 정한 수까지만 준다', () => {
    const names = ['가', '나', '나', '다', '라']
    const shops = recentShopsOf(
      names.map((sellerName, index) => order({ id: `o${index}`, sellerName })),
      3,
    )
    expect(shops.map((shop) => shop.name)).toEqual(['나', '가', '다'])
  })
})
