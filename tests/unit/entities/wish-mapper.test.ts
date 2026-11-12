import { describe, expect, it } from 'vitest'
import { toWishRequest, toWishTimeline, type MockWishRequestDto } from '@/entities/wish'

/** BE WishRequestResponse (#999) 그대로 */
function dto(change: Partial<MockWishRequestDto> = {}): MockWishRequestDto {
  return {
    requestId: '1',
    type: 'WISH',
    childId: '2',
    status: 'REQUESTED',
    requestedByType: 'CHILD',
    requestedById: '5',
    message: '사 주세요',
    requestedAt: '2026-11-09T10:00:00',
    payerType: null,
    payerId: null,
    paidAt: null,
    rejectReason: null,
    rejectedAt: null,
    cancelReason: null,
    cancelledAt: null,
    expiresAt: '2026-11-16T10:00:00',
    expiredAt: null,
    items: [
      {
        cartItemId: '30',
        optionId: '4',
        productId: '7',
        sellerId: '9',
        productName: '맨투맨',
        optionName: '네이비 / 110',
        size: '110',
        sellerName: '키즐리',
        quantity: 3,
        unitPrice: 25000,
        purchasable: true,
        saleStatus: 'ON_SALE',
        purchased: false,
      },
      {
        cartItemId: '31',
        optionId: '5',
        productId: null,
        sellerId: null,
        productName: null,
        optionName: null,
        size: null,
        sellerName: null,
        quantity: 1,
        unitPrice: null,
        purchasable: false,
        saleStatus: null,
        purchased: false,
      },
    ],
    purchases: [],
    paidOrderItemIds: [],
    ...change,
  }
}

describe('조르기 응답 변환', () => {
  it('장바구니 칸 ID와 보낸 수량을 그대로 옮긴다', () => {
    const wish = toWishRequest(dto())
    expect(wish.items[0]).toMatchObject({ cartItemId: '30', quantity: 3, purchasedQuantity: 0 })
    expect(wish.requestedByType).toBe('CHILD')
    expect(wish.status).toBe('REQUESTED')
    expect(wish.decidedAt).toBeNull()
    expect(wish.orderIds).toEqual([])
  })

  it('삭제된 상품의 빈 표시값을 대체한다', () => {
    const wish = toWishRequest(dto())
    expect(wish.items[1].productName).toBe('판매가 끝난 상품')
    expect(wish.items[1].productId).toBeNull()
  })

  it('결제 완료(PAID)면 칸마다 산 수량을 더하고 결제 시각을 답한 시각으로 둔다', () => {
    const wish = toWishRequest(
      dto({
        status: 'PAID',
        payerType: 'MEMBER',
        payerId: '1',
        paidAt: '2026-11-09T10:05:00',
        purchases: [
          { orderId: '8', cartItemId: '30', quantity: 1, purchasedAt: '2026-11-09T10:05:00' },
          { orderId: '9', cartItemId: '30', quantity: 1, purchasedAt: '2026-11-09T10:06:00' },
          { orderId: '9', cartItemId: null, quantity: 1, purchasedAt: '2026-11-09T10:06:00' },
        ],
      }),
    )
    expect(wish.status).toBe('PAID')
    expect(wish.items.map((item) => item.purchasedQuantity)).toEqual([2, 0])
    expect(wish.decidedAt).toBe('2026-11-09T10:05:00')
    expect(wish.orderIds).toEqual(['8', '9'])
  })

  it('거절 · 철회 시각도 답한 시각으로 둔다', () => {
    expect(
      toWishRequest(
        dto({ status: 'REJECTED', rejectReason: 'OTHER', rejectedAt: '2026-11-09T11:00:00' }),
      ).decidedAt,
    ).toBe('2026-11-09T11:00:00')
    expect(
      toWishRequest(
        dto({ status: 'CANCELLED', cancelReason: 'DIRECT', cancelledAt: '2026-11-09T12:00:00' }),
      ).decidedAt,
    ).toBe('2026-11-09T12:00:00')
  })

  it('타임라인 응답을 화면 모델로 변환한다', () => {
    const input = {
      requestId: '1',
      status: 'PAID',
      rejectReason: null,
      cancelReason: null,
      orderIds: ['8'],
      cancelledBy: null,
      steps: [
        { step: 'SENT', status: 'DONE' as const, at: '2026-01-01', extra: true },
        { step: 'PAID', status: 'WAITING' as const, at: null },
      ],
    }
    expect(toWishTimeline(input)).toEqual({
      requestId: '1',
      status: 'PAID',
      orderIds: ['8'],
      steps: [
        { step: 'SENT', status: 'DONE', at: '2026-01-01' },
        { step: 'PAID', status: 'WAITING', at: null },
      ],
    })
    expect(toWishTimeline(input).steps).not.toBe(input.steps)
  })
})
