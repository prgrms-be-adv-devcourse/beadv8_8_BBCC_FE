import { describe, expect, it } from 'vitest'
import {
  canHandleOrderDeadLetter,
  closeMemoError,
  deadLetterTabOf,
  orderDeadLetterOutcomeOf,
  orderDeadLetterStatusOf,
  toOrderDeadLetter,
  toOrderDeadLetterSummary,
} from '@/entities/dead-letter'
import { validate } from '@/shared/api/contract'
import {
  orderDeadLetterPageShape,
  orderDeadLetterShape,
} from '@/entities/dead-letter/api/order-dead-letter.shape'

// BE AdminOrderDeadLetterController (#601) 목록 한 줄 · 상세
const summary = {
  deadLetterId: '3',
  lastReceivedAt: '2026-11-12T10:00:00',
  failureType: 'PROCESS_FAILED',
  eventType: 'payment.completed',
  orderId: '16',
  receivedCount: 2,
  status: 'OPEN',
  paymentEvent: true,
}

const detail: Parameters<typeof toOrderDeadLetter>[0] = {
  deadLetterId: '3',
  sourceTopic: 'kidly.payment.events',
  sourcePartition: 0,
  sourceOffset: 30,
  messageKey: '16',
  eventType: 'payment.completed',
  eventId: 'e-1',
  payload: '{"orderId":16}',
  producer: 'payment',
  occurredAt: '2026-11-12T09:59:00',
  aggregateId: '16',
  correlationId: 'c-1',
  orderId: '16',
  orderStatus: 'PENDING_PAYMENT',
  failureType: 'PROCESS_FAILED',
  exceptionClass: 'java.lang.IllegalStateException',
  exceptionMessage: 'boom',
  stackTraceHead: 'at A\nat B',
  firstReceivedAt: '2026-11-12T09:59:30',
  lastReceivedAt: '2026-11-12T10:00:00',
  receivedCount: 2,
  status: 'OPEN',
  handledBy: null,
  handledAt: null,
  memo: null,
  reprocessCount: 0,
  lastReprocessedAt: null,
  lastReprocessResult: null,
  recommendedAction: '원인을 고친 뒤 재처리하세요.',
  paymentEvent: true,
}

describe('주문 처리 실패 메시지 (BE #601)', () => {
  it('계약 모양: 목록 · 상세', () => {
    const page = {
      content: [summary],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
    }
    expect(validate(page, orderDeadLetterPageShape)).toEqual([])
    expect(validate(detail, orderDeadLetterShape)).toEqual([])
    expect(validate({ ...detail, orderId: null, producer: null }, orderDeadLetterShape)).toEqual([])
  })

  it('목록 매퍼: 실패 유형을 한글로, 모르는 값은 그대로', () => {
    expect(toOrderDeadLetterSummary(summary)).toEqual({
      id: '3',
      lastReceivedAt: '2026-11-12T10:00:00',
      failureType: '처리 실패',
      eventType: 'payment.completed',
      orderId: '16',
      receivedCount: 2,
      status: 'OPEN',
      isPaymentEvent: true,
    })
    expect(toOrderDeadLetterSummary({ ...summary, failureType: 'NEW' }).failureType).toBe('NEW')
  })

  it('상세 매퍼: id · 실패 유형 · 결제 표시', () => {
    expect(toOrderDeadLetter(detail)).toMatchObject({
      id: '3',
      failureType: '처리 실패',
      isPaymentEvent: true,
      reprocessCount: 0,
      orderStatus: 'PENDING_PAYMENT',
    })
    expect(toOrderDeadLetter({ ...detail, failureType: 'READ_FAILED' }).failureType).toBe(
      '읽기 실패',
    )
  })

  it('조치(재처리 · 종료)는 처리 대기일 때만', () => {
    const of = (status: string) => toOrderDeadLetter({ ...detail, status })
    expect(canHandleOrderDeadLetter(of('OPEN'))).toBe(true)
    expect(canHandleOrderDeadLetter(of('REPROCESSED'))).toBe(false)
    expect(canHandleOrderDeadLetter(of('CLOSED'))).toBe(false)
  })

  it('재처리 결과: 응답 상태 · 횟수로 고른다', () => {
    const before = toOrderDeadLetter(detail)
    const after = (patch: Partial<typeof detail>) =>
      orderDeadLetterOutcomeOf(before.reprocessCount, toOrderDeadLetter({ ...detail, ...patch }))
    expect(after({ status: 'REPROCESSED', reprocessCount: 1 })).toEqual({ kind: 'REPROCESSED' })
    expect(after({ status: 'REPROCESSED', reprocessCount: 0 })).toEqual({
      kind: 'ALREADY_REPROCESSED',
    })
    expect(
      after({ status: 'OPEN', reprocessCount: 1, lastReprocessResult: 'IllegalStateException' }),
    ).toEqual({ kind: 'FAILED', failureType: 'IllegalStateException' })
  })

  it('종료 메모: 비우면 안 되고 500자까지', () => {
    expect(closeMemoError('')).toBe('확인한 내용이나 종료 이유를 적어 주세요.')
    expect(closeMemoError('   ')).toBe('확인한 내용이나 종료 이유를 적어 주세요.')
    expect(closeMemoError('가'.repeat(500))).toBeNull()
    expect(closeMemoError('가'.repeat(501))).toBe('500자까지 적을 수 있어요.')
  })

  it('주소의 ?status= → 주문 상태 (CLOSED 포함), ?module= → 탭 (주문 포함)', () => {
    expect(orderDeadLetterStatusOf('CLOSED')).toBe('CLOSED')
    expect(orderDeadLetterStatusOf('closed')).toBe('OPEN')
    expect(orderDeadLetterStatusOf(null)).toBe('OPEN')
    expect(deadLetterTabOf('order')).toBe('order')
    expect(deadLetterTabOf('community')).toBe('community')
    expect(deadLetterTabOf('payment')).toBe('auth')
    expect(deadLetterTabOf(null)).toBe('auth')
  })
})
