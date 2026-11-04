import { describe, expect, it } from 'vitest'
import { toWishRequest, toWishTimeline } from '@/entities/wish'

describe('조르기 응답 변환', () => {
  it('타임라인 응답을 화면 모델로 변환한다', () => {
    const input = {
      requestId: '1',
      status: 'REQUESTED',
      checkout: null,
      rejectReason: null,
      orderId: null,
      steps: [{ step: 'SENT', status: 'DONE' as const, at: '2026-01-01', extra: true }],
    }
    expect(toWishTimeline(input)).toEqual({
      ...input,
      steps: [{ step: 'SENT', status: 'DONE', at: '2026-01-01' }],
    })
    expect(toWishTimeline(input).steps).not.toBe(input.steps)
  })
  it('삭제된 상품의 빈 표시값을 대체한다', () => {
    const request = toWishRequest({
      requestId: '1',
      childId: '2',
      status: 'REQUESTED',
      requestedBy: 'CHILD',
      message: null,
      requestedAt: '2026-01-01',
      checkout: null,
      orderId: null,
      orderResult: null,
      rejectReason: null,
      decidedAt: null,
      items: [
        {
          wishItemId: '3',
          optionId: '4',
          productId: null,
          sellerId: null,
          productName: null,
          optionName: null,
          size: null,
          sellerName: null,
          requestedQuantity: 2,
          approvedQuantity: null,
          unitPrice: null,
          purchasable: false,
          saleStatus: null,
        },
      ],
    })
    expect(request.items[0].productName).toBe('판매가 끝난 상품')
    expect(request.items[0].productId).toBeNull()
  })
})
