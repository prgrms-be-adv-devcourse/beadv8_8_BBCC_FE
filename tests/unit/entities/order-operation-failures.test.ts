import { describe, expect, it } from 'vitest'
import {
  canRetryFailure,
  eventTypeLabel,
  opsStatusLabel,
  opsTargetLabel,
  toStuckOrder,
  failureStatusLabel,
  toEventFailure,
  toPaymentRecovery,
  toQuarantinedOutbox,
} from '@/entities/order-operation'
import {
  eventFailurePageShape,
  paymentRecoveryPageShape,
  quarantinedOutboxPageShape,
} from '@/entities/order-operation/api/order-ops.shape'
import { validate } from '@/shared/api/contract'

const pageOf = (row: unknown) => ({
  content: [row],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
  hasNext: false,
})
// BE PaymentRecoveryResponse (#353)
const recovery = {
  recoveryId: '5',
  orderId: '16',
  paymentId: '9',
  memberId: '1',
  amount: 5500,
  items: [{ orderItemId: '41', amount: 5500 }],
  status: 'PENDING',
  failureCode: 'ORDER_STATE_CONFLICT',
  attemptCount: 2,
  lastAttemptedAt: '2026-11-12T10:00:00',
  createdAt: '2026-11-12T09:00:00',
}
// BE OrderEventFailureResponse (#449)
const failure = {
  failureId: '7',
  eventType: 'stock.deducted',
  orderId: '16',
  stockFailures: [{ orderItemId: '41', reason: 'OUT_OF_STOCK' }],
  status: 'PENDING',
  failureCode: 'OptimisticLockException',
  attemptCount: 1,
  lastAttemptedAt: null,
  createdAt: '2026-11-12T09:00:00',
}
// BE OutboxQuarantineResponse (#602)
const outbox = {
  outboxId: '3',
  eventId: 'b4c5',
  eventType: 'order.paid',
  topic: 'kidly.order.events',
  messageKey: '16',
  status: 'QUARANTINED',
  attemptCount: 10,
  lastError: 'TimeoutException',
  createdAt: '2026-11-12T09:00:00',
  quarantinedAt: '2026-11-12T09:30:00',
  sentAt: null,
  lastRetriedAt: null,
  lastRetriedBy: null,
  retryCount: 0,
}

describe('관리자 처리 대기: 결제 반영 실패 · 이벤트 처리 실패 · 격리된 이벤트', () => {
  it('계약 모양', () => {
    expect(validate(pageOf(recovery), paymentRecoveryPageShape)).toEqual([])
    expect(validate(pageOf(failure), eventFailurePageShape)).toEqual([])
    expect(validate(pageOf(outbox), quarantinedOutboxPageShape)).toEqual([])
  })
  it('매퍼', () => {
    expect(toPaymentRecovery(recovery)).toMatchObject({
      id: '5',
      orderId: '16',
      amount: 5500,
      status: 'PENDING',
      failureCode: 'ORDER_STATE_CONFLICT',
      attemptCount: 2,
    })
    expect(toEventFailure(failure)).toMatchObject({
      id: '7',
      eventType: 'stock.deducted',
      orderId: '16',
      stockFailureCount: 1,
    })
    expect(toQuarantinedOutbox(outbox)).toMatchObject({
      id: '3',
      eventType: 'order.paid',
      orderId: '16',
      lastError: 'TimeoutException',
    })
  })
  it('메시지 키가 주문 ID 모양이 아니면 주문 링크 없음', () => {
    expect(toQuarantinedOutbox({ ...outbox, messageKey: 'a-b-c' }).orderId).toBeNull()
  })
  it('재처리 · 종료는 대기(PENDING)일 때만', () => {
    expect(canRetryFailure({ status: 'PENDING' })).toBe(true)
    for (const status of ['RECOVERED', 'CANCELLED', 'NOT_RETRYABLE'])
      expect(canRetryFailure({ status })).toBe(false)
  })
  it('상태 라벨: 모르는 값은 코드 그대로', () => {
    expect(failureStatusLabel('PENDING')).toBe('처리 대기')
    expect(failureStatusLabel('NOT_RETRYABLE')).toBe('재처리 불가')
    expect(failureStatusLabel('NEW')).toBe('NEW')
  })
})

describe('관리자 화면에 백엔드 코드 대신 한글 (AGENTS 4절)', () => {
  it('대상 · 상태 · 이벤트 종류 라벨, 모르는 값은 코드 그대로', () => {
    expect(opsTargetLabel('DELIVERY')).toBe('배송')
    expect(opsTargetLabel('ORDER_OUTBOX')).toBe('보낼 이벤트')
    expect(opsStatusLabel('READY')).toBe('발송 준비')
    expect(opsStatusLabel('UNSENT')).toBe('보내지 못함')
    expect(eventTypeLabel('order.paid')).toBe('주문 결제 완료')
    expect(eventTypeLabel('stock.deducted')).toBe('재고 차감')
    expect(eventTypeLabel('new.event')).toBe('new.event')
  })
  it('아웃박스 멈춤 줄은 아웃박스 ID로 구분한다 (대상 · 주문 ID가 없을 때 겹치지 않게)', () => {
    const base = {
      kind: 'OUTBOX_STUCK',
      orderId: null,
      targetType: 'ORDER_OUTBOX',
      targetId: null,
      status: 'UNSENT',
      since: '2026-11-12T10:00:00',
      aiMemo: null,
    }
    const outbox = (outboxId: string) => ({
      outboxId,
      eventType: 'order.paid',
      eventId: 'e',
      attemptCount: 1,
      createdAt: '2026-11-12T10:00:00',
      lastError: null,
      backlogCount: 0,
      quarantinedAt: null,
    })
    expect(toStuckOrder({ ...base, outbox: outbox('1') }).key).not.toBe(
      toStuckOrder({ ...base, outbox: outbox('2') }).key,
    )
  })
})
