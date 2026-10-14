import { describe, expect, it } from 'vitest'
import {
  checkOrderPayment,
  findPaymentOfOrder,
  toPayment,
  type OrderPaymentInput,
  type Payment,
} from '@/entities/payment'

const dto = {
  paymentId: 3,
  orderId: 6,
  amount: 25000,
  refundedAmount: 0,
  status: 'COMPLETED',
  failureCode: null,
  paidAt: '2026-10-15T10:00:02',
  createdAt: '2026-10-15T10:00:02',
}

const payment = (patch: Partial<Payment> = {}): Payment => ({ ...toPayment(dto), ...patch })
const order = (patch: Partial<OrderPaymentInput> = {}): OrderPaymentInput => ({
  id: '6',
  status: 'PAID',
  cancelReason: null,
  totalAmount: 25000,
  ...patch,
})

describe('toPayment: 결제 응답 → 화면 모델', () => {
  it('숫자 ID를 문자열로 바꾼다 (주문 쪽 ID와 비교하려고)', () => {
    expect(toPayment(dto)).toEqual({
      id: '3',
      orderId: '6',
      amount: 25000,
      refundedAmount: 0,
      status: 'COMPLETED',
      failureCode: null,
      paidAt: '2026-10-15T10:00:02',
      createdAt: '2026-10-15T10:00:02',
    })
  })
})

describe('findPaymentOfOrder: 내 결제 목록에서 주문의 결제 찾기', () => {
  it('주문번호가 같은 결제를 찾는다', () => {
    const list = [payment({ id: '4', orderId: '7' }), payment()]
    expect(findPaymentOfOrder(list, '6')?.id).toBe('3')
  })
  it('없으면 null', () => {
    expect(findPaymentOfOrder([payment({ orderId: '7' })], '6')).toBeNull()
    expect(findPaymentOfOrder(undefined, '6')).toBeNull()
  })
})

describe('checkOrderPayment: 주문 상태 ↔ 결제 기록 맞춰 보기', () => {
  it('결제 처리 중이고 기록이 없으면 대기', () => {
    expect(checkOrderPayment(order({ status: 'PENDING_PAYMENT' }), null).result).toBe('WAITING')
  })
  it('결제 처리 중인데 기록이 먼저 생겼으면 대기 (주문 반영 이벤트를 기다림)', () => {
    expect(checkOrderPayment(order({ status: 'PENDING_PAYMENT' }), payment()).result).toBe(
      'WAITING',
    )
  })

  it('결제 완료 ↔ 같은 금액의 COMPLETED 결제면 일치', () => {
    expect(checkOrderPayment(order(), payment()).result).toBe('MATCH')
  })
  it('결제 완료인데 결제 기록이 없으면 불일치', () => {
    expect(checkOrderPayment(order(), null).result).toBe('MISMATCH')
  })
  it('금액이 1원이라도 다르면 불일치 (경계)', () => {
    expect(checkOrderPayment(order({ totalAmount: 25001 }), payment()).result).toBe('MISMATCH')
    expect(checkOrderPayment(order({ totalAmount: 24999 }), payment()).result).toBe('MISMATCH')
  })
  it('결제 완료인데 결제 기록이 FAILED면 불일치', () => {
    expect(
      checkOrderPayment(order(), payment({ status: 'FAILED', failureCode: 'INSUFFICIENT_BALANCE' }))
        .result,
    ).toBe('MISMATCH')
  })

  it('잔액 부족 취소 ↔ FAILED(INSUFFICIENT_BALANCE) 기록이면 일치', () => {
    const cancelled = order({ status: 'CANCELLED', cancelReason: 'PAYMENT_FAILED' })
    expect(
      checkOrderPayment(
        cancelled,
        payment({ status: 'FAILED', failureCode: 'INSUFFICIENT_BALANCE', paidAt: null }),
      ).result,
    ).toBe('MATCH')
  })
  it('결제 실패 취소인데 기록이 없으면 안내 (금액 불일치 · 지갑 없음은 기록을 남기지 않음)', () => {
    const cancelled = order({ status: 'CANCELLED', cancelReason: 'PAYMENT_FAILED' })
    expect(checkOrderPayment(cancelled, null).result).toBe('INFO')
  })
  it('취소된 주문에 COMPLETED 결제가 남아 있으면 불일치 (돈만 빠짐)', () => {
    const cancelled = order({ status: 'CANCELLED', cancelReason: 'PAYMENT_FAILED' })
    expect(checkOrderPayment(cancelled, payment()).result).toBe('MISMATCH')
  })

  it('재고 부족 · 시간 초과 취소는 결제 기록이 없어야 일치', () => {
    for (const cancelReason of ['OUT_OF_STOCK', 'PAYMENT_EXPIRED'] as const) {
      const cancelled = order({ status: 'CANCELLED', cancelReason })
      expect(checkOrderPayment(cancelled, null).result).toBe('MATCH')
      expect(checkOrderPayment(cancelled, payment()).result).toBe('MISMATCH')
    }
  })
  it('취소된 주문이라도 전액 환불된 결제면 일치', () => {
    const cancelled = order({ status: 'CANCELLED', cancelReason: 'OUT_OF_STOCK' })
    expect(
      checkOrderPayment(cancelled, payment({ status: 'REFUNDED', refundedAmount: 25000 })).result,
    ).toBe('MATCH')
  })

  it('결과마다 화면에 보여 줄 설명이 있다', () => {
    expect(checkOrderPayment(order(), payment()).message).toMatch(/25,000원/)
    expect(checkOrderPayment(order({ totalAmount: 30000 }), payment()).message).toMatch(
      /30,000원.*25,000원/,
    )
  })
})
