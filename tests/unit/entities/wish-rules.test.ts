import { describe, expect, it } from 'vitest'
import {
  canDecideWish,
  canRemoveChildCartLine,
  canSendWishLine,
  countPendingWishes,
  wishLineDecisionLabel,
  wishRejectReasonLabel,
  wishStatusLabel,
  wishTitle,
  wishTimelineLabel,
  wishTimelineStatusLabel,
} from '@/entities/wish'

describe('조르기 규칙', () => {
  it('거절 사유를 쉬운 말로 보여 준다', () => {
    expect(wishRejectReasonLabel('TOO_EXPENSIVE')).toBe('너무 비싸요')
    expect(wishRejectReasonLabel('ALREADY_HAVE')).toBe('이미 있어요')
    expect(wishRejectReasonLabel('NEXT_TIME')).toBe('다음에 사자')
    expect(wishRejectReasonLabel('OTHER')).toBe('기타')
  })

  it('조르기에 예약되지 않은 장바구니 상품만 뺀다', () => {
    expect(canRemoveChildCartLine({ reserved: false })).toBe(true)
    expect(canRemoveChildCartLine({ reserved: true })).toBe(false)
  })

  it('진행 단계는 사용자에게 이해할 수 있는 문구로 보여 준다 (SENT → PAID · REJECTED · CANCELLED)', () => {
    expect(wishTimelineLabel('SENT')).toBe('조르기 보냄')
    expect(wishTimelineLabel('PAID')).toBe('결제 완료')
    expect(wishTimelineLabel('REJECTED')).toBe('거절')
    expect(wishTimelineLabel('CANCELLED')).toBe('철회')
    expect(wishTimelineLabel('UNKNOWN')).toBe('진행 중')
    expect(wishTimelineStatusLabel('DONE')).toBe('완료')
    expect(wishTimelineStatusLabel('WAITING')).toBe('대기')
  })

  it('판매 중이고 조르기에 예약되지 않은 상품만 보낼 수 있다', () => {
    expect(canSendWishLine({ purchasable: true, reserved: false })).toBe(true)
    expect(canSendWishLine({ purchasable: false, reserved: false })).toBe(false)
    expect(canSendWishLine({ purchasable: true, reserved: true })).toBe(false)
  })

  it('대기 중인 조르기만 승인(결제)하거나 거절할 수 있다', () => {
    expect(canDecideWish({ status: 'REQUESTED' })).toBe(true)
    expect(canDecideWish({ status: 'PAID' })).toBe(false)
    expect(canDecideWish({ status: 'REJECTED' })).toBe(false)
    expect(canDecideWish({ status: 'CANCELLED' })).toBe(false)
  })

  it('상태를 사용자 말로 보여 준다 (결제 완료 = PAID)', () => {
    expect(wishStatusLabel({ status: 'REQUESTED' })).toBe('대기')
    expect(wishStatusLabel({ status: 'PAID' })).toBe('결제 완료')
    expect(wishStatusLabel({ status: 'REJECTED' })).toBe('거절')
    expect(wishStatusLabel({ status: 'CANCELLED' })).toBe('철회됨')
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
      countPendingWishes([{ status: 'REQUESTED' }, { status: 'PAID' }, { status: 'REQUESTED' }]),
    ).toBe(2)
    expect(countPendingWishes([{ status: 'REJECTED' }, { status: 'CANCELLED' }])).toBe(0)
  })

  it('결제 완료된 조르기는 줄마다 산 수량을, 사지 않은 줄은 제외로 보여 준다', () => {
    expect(wishLineDecisionLabel({ status: 'PAID' }, { purchasedQuantity: 2 })).toBe('2개 결제')
    expect(wishLineDecisionLabel({ status: 'PAID' }, { purchasedQuantity: 0 })).toBe('제외')
    expect(wishLineDecisionLabel({ status: 'REQUESTED' }, { purchasedQuantity: 0 })).toBeNull()
    expect(wishLineDecisionLabel({ status: 'REJECTED' }, { purchasedQuantity: 0 })).toBeNull()
  })
})
