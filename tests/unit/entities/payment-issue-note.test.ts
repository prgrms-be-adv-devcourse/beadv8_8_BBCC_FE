import { describe, expect, it } from 'vitest'
import { paymentIssueNote, type Payment } from '@/entities/payment'

const base: Payment = {
  id: '3',
  orderId: '6',
  amount: 25000,
  refundedAmount: 0,
  status: 'COMPLETED',
  failureCode: null,
  paidAt: '2026-10-08T10:00:00',
  createdAt: '2026-10-08T10:00:00',
}

describe('paymentIssueNote: 관리자 결제 목록 · 상세의 「실패 · 환불」 한 줄', () => {
  it('실패 · 환불이 없으면 빈 글자', () => {
    expect(paymentIssueNote(base)).toBe('')
  })

  it('실패면 실패 이유', () => {
    expect(
      paymentIssueNote({
        ...base,
        status: 'FAILED',
        failureCode: 'INSUFFICIENT_BALANCE',
        paidAt: null,
      }),
    ).toBe('예치금 잔액 부족')
  })

  it('환불 금액이 있으면 환불 금액', () => {
    expect(paymentIssueNote({ ...base, status: 'PARTIALLY_REFUNDED', refundedAmount: 5000 })).toBe(
      '환불 5,000원',
    )
  })

  it('둘 다 있으면 실패 이유 · 환불 금액 순서', () => {
    expect(
      paymentIssueNote({ ...base, failureCode: 'AMOUNT_MISMATCH', refundedAmount: 25000 }),
    ).toBe('주문 금액 불일치 · 환불 25,000원')
  })
})
