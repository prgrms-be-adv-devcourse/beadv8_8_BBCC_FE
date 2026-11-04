import { describe, expect, it } from 'vitest'
import {
  canDecideWish,
  canSendWishLine,
  canRemoveChildWishLine,
  countPendingWishes,
  wishLineDecisionLabel,
  wishStatusLabel,
  wishTitle,
  wishTimelineLabel,
  wishTimelineStatusLabel,
} from '@/entities/wish'

describe('조르기 규칙', () => {
  it('자녀가 담고 진행 중인 조르기에 없는 줄만 뺀다', () => {
    expect(canRemoveChildWishLine({ addedBy: 'CHILD', requestId: null })).toBe(true)
    expect(canRemoveChildWishLine({ addedBy: 'PARENT', requestId: null })).toBe(false)
    expect(canRemoveChildWishLine({ addedBy: 'CHILD', requestId: '1' })).toBe(false)
  })
  it('진행 단계는 사용자에게 이해할 수 있는 문구로 보여 준다', () => {
    expect(wishTimelineLabel('SENT')).toBe('조르기 보냄')
    expect(wishTimelineLabel('PAYMENT_REQUESTED')).toBe('결제 대기')
    expect(wishTimelineLabel('UNKNOWN')).toBe('진행 중')
    expect(wishTimelineStatusLabel('DONE')).toBe('완료')
    expect(wishTimelineStatusLabel('WAITING')).toBe('대기')
    expect(wishTimelineStatusLabel('PARTIAL')).toBe('일부 완료')
    expect(wishTimelineStatusLabel('NOT_APPLICABLE')).toBe('해당 없음')
  })
  it('판매 중이고 진행 중인 조르기에 없는 상품만 보낼 수 있다', () => {
    expect(canSendWishLine({ purchasable: true, requestId: null })).toBe(true)
    expect(canSendWishLine({ purchasable: false, requestId: null })).toBe(false)
    expect(canSendWishLine({ purchasable: true, requestId: '3' })).toBe(false)
  })

  it('응답 전인 조르기만 승인하거나 거절할 수 있다', () => {
    expect(canDecideWish({ status: 'REQUESTED' })).toBe(true)
    expect(canDecideWish({ status: 'APPROVED' })).toBe(false)
    expect(canDecideWish({ status: 'REJECTED' })).toBe(false)
  })

  it('승인 후에는 주문 결제 결과를 구분해 표시한다', () => {
    expect(wishStatusLabel({ status: 'REQUESTED', orderResult: null })).toBe('대기')
    expect(wishStatusLabel({ status: 'APPROVED', orderResult: null })).toBe('결제 대기')
    expect(wishStatusLabel({ status: 'APPROVED', orderResult: 'PAID' })).toBe('결제 완료')
    expect(wishStatusLabel({ status: 'APPROVED', orderResult: 'CANCELLED' })).toBe('취소됨')
    expect(wishStatusLabel({ status: 'REJECTED', orderResult: null })).toBe('거절')
    expect(wishStatusLabel({ status: 'APPROVED', orderResult: null, checkout: 'CART' })).toBe(
      '승인',
    )
  })

  it('목록 제목은 첫 상품 이름에 나머지 상품 수를 붙인다', () => {
    expect(wishTitle({ items: [{ productName: '맨투맨' }] })).toBe('맨투맨')
    expect(
      wishTitle({
        items: [{ productName: '맨투맨' }, { productName: '팬츠' }, { productName: '모자' }],
      }),
    ).toBe('맨투맨 외 2개')
  })

  it('응답을 기다리는 조르기만 센다', () => {
    expect(
      countPendingWishes([
        { status: 'REQUESTED' },
        { status: 'APPROVED' },
        { status: 'REQUESTED' },
      ]),
    ).toBe(2)
    expect(countPendingWishes([{ status: 'REJECTED' }])).toBe(0)
  })

  it('승인한 조르기는 줄마다 승인 수량을, 고르지 않은 줄은 제외로 보여 준다', () => {
    expect(wishLineDecisionLabel({ status: 'APPROVED' }, { approvedQuantity: 2 })).toBe('2개 승인')
    expect(wishLineDecisionLabel({ status: 'APPROVED' }, { approvedQuantity: null })).toBe('제외')
    expect(wishLineDecisionLabel({ status: 'REQUESTED' }, { approvedQuantity: null })).toBeNull()
    expect(wishLineDecisionLabel({ status: 'REJECTED' }, { approvedQuantity: null })).toBeNull()
  })
})
