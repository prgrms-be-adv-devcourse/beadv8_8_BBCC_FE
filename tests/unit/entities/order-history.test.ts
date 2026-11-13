import { describe, expect, it } from 'vitest'
import {
  currentCancelledAtOf,
  currentCancelReasonOf,
  currentOrderStatusOf,
  toOrderHistory,
} from '@/entities/order'
import { validate } from '@/shared/api/contract'
import { orderHistoryShape } from '@/entities/order/api/order.shape'

// BE AdminOrderController GET /admin/orders/{orderId}/history (#442) 한 줄
const placed = {
  historyId: '1',
  targetType: 'ORDER',
  targetId: '16',
  fromStatus: null,
  toStatus: 'PENDING_PAYMENT',
  reason: null,
  actorType: 'BUYER',
  actorId: '1',
  source: 'POST /api/v1/orders',
  occurredAt: '2026-11-12T10:00:00',
}

describe('관리자 주문 상태 이력 (BE #442)', () => {
  it('계약 모양: 목록', () => {
    expect(validate([placed], orderHistoryShape)).toEqual([])
  })

  it('매퍼: 대상 · 상태 · 누가 · 출처를 한글로', () => {
    expect(toOrderHistory(placed)).toEqual({
      id: '1',
      targetType: 'ORDER',
      target: '주문',
      targetId: '16',
      from: null,
      to: '결제 처리 중',
      toCode: 'PENDING_PAYMENT',
      reason: null,
      actor: '구매자 (회원 1)',
      source: '주문하기',
      occurredAt: '2026-11-12T10:00:00',
    })
  })

  it('대상별 상태표: 주문상품 · 배송 · 결제 복구', () => {
    const row = (targetType: string, fromStatus: string | null, toStatus: string) =>
      toOrderHistory({ ...placed, targetType, fromStatus, toStatus })
    expect(row('ORDER_ITEM', 'ORDERED', 'CONFIRMED')).toMatchObject({
      target: '주문상품',
      from: '주문됨',
      to: '구매확정',
    })
    expect(row('DELIVERY', 'READY', 'SHIPPING')).toMatchObject({
      target: '배송',
      from: '발송 준비',
      to: '배송 중',
    })
    expect(row('PAYMENT_RECOVERY', 'PENDING', 'RECOVERED')).toMatchObject({
      target: '결제 복구',
      from: '복구 대기',
      to: '복구됨',
    })
  })

  it('취소 사유는 한글로, 모르는 사유 · 출처 · 상태는 그대로', () => {
    expect(
      toOrderHistory({
        ...placed,
        fromStatus: 'PAID',
        toStatus: 'CANCELLED',
        reason: 'SELLER_CANCELLED',
        actorType: 'SELLER',
        actorId: '5',
        source: 'POST /api/v1/seller/orders/{sellerOrderId}/cancel',
      }),
    ).toMatchObject({
      to: '구매하지 못했어요',
      reason: '판매자가 주문을 취소했어요.',
      actor: '판매자 (회원 5)',
      source: '판매자 취소',
    })
    expect(
      toOrderHistory({ ...placed, toStatus: 'NEW', reason: 'X', source: 'job:new' }),
    ).toMatchObject({ to: 'NEW', reason: 'X', source: 'job:new' })
  })

  it('누가: 시스템 · 서버 이벤트는 번호 없이', () => {
    const actor = (actorType: string, actorId: string | null) =>
      toOrderHistory({ ...placed, actorType, actorId }).actor
    expect(actor('SYSTEM', null)).toBe('시스템')
    expect(actor('EVENT', null)).toBe('서버 이벤트')
    expect(actor('ADMIN', '9')).toBe('관리자 (회원 9)')
  })

  it('지금 주문 상태: 주문 대상 이력의 마지막 상태, 없으면 null', () => {
    const history = [
      placed,
      { ...placed, historyId: '2', fromStatus: 'PENDING_PAYMENT', toStatus: 'PAID' },
      { ...placed, historyId: '3', targetType: 'DELIVERY', toStatus: 'SHIPPING' },
    ]
    expect(currentOrderStatusOf(history.map(toOrderHistory))).toBe('PAID')
    expect(currentOrderStatusOf([])).toBeNull()
  })
  it('지금 취소 사유: 마지막 주문 이력이 취소일 때만 그 사유', () => {
    const cancelled = toOrderHistory({
      ...placed,
      historyId: '2',
      toStatus: 'CANCELLED',
      reason: 'PAYMENT_EXPIRED',
    })
    expect(currentCancelReasonOf([toOrderHistory(placed), cancelled])).toBe(
      '결제 마감 시간이 지나 주문이 자동으로 취소됐어요.',
    )
    expect(currentCancelReasonOf([toOrderHistory(placed)])).toBeNull()
  })
  // 관리자 주문 상세 API는 없어서, 취소 시각은 이력의 마지막 주문 취소 줄 시각을 쓴다 (BE #1325 안내)
  it('지금 취소 시각: 마지막 주문 이력이 취소일 때만 그 시각', () => {
    const cancelled = toOrderHistory({
      ...placed,
      historyId: '2',
      toStatus: 'CANCELLED',
      reason: 'PAYMENT_EXPIRED',
      occurredAt: '2026-11-12T10:30:00',
    })
    expect(currentCancelledAtOf([toOrderHistory(placed), cancelled])).toBe('2026-11-12T10:30:00')
    expect(currentCancelledAtOf([toOrderHistory(placed)])).toBeNull()
  })
})
