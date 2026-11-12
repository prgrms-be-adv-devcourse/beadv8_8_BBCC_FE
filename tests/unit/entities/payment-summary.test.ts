import { describe, expect, it } from 'vitest'
import { paymentSummaryOf } from '@/app/mocks/admin-handlers'
import { paidOn, toAdminPaymentSummary, type AdminPaymentDto } from '@/entities/payment'

const DTO = {
  daily: [
    { date: '2026-11-10', paidAmount: 0, paidCount: 0 },
    { date: '2026-11-11', paidAmount: 52000, paidCount: 2 },
  ],
  refundedPaymentCount: 3,
}

describe('toAdminPaymentSummary: 관리자 결제 요약 응답 → 화면 모델', () => {
  it('날짜별 결제 금액 · 건수와 환불 있는 결제 수를 그대로 옮긴다', () => {
    expect(toAdminPaymentSummary(DTO)).toEqual({
      daily: [
        { date: '2026-11-10', paidAmount: 0, paidCount: 0 },
        { date: '2026-11-11', paidAmount: 52000, paidCount: 2 },
      ],
      refundedPaymentCount: 3,
    })
  })
})

describe('paidOn: 요약에서 그날(결제일) 결제 금액 · 건수', () => {
  const summary = toAdminPaymentSummary(DTO)
  it('그날 줄을 찾는다', () => {
    expect(paidOn(summary, '2026-11-11')).toEqual({
      date: '2026-11-11',
      paidAmount: 52000,
      paidCount: 2,
    })
  })
  it('기간 밖 날짜는 0', () => {
    expect(paidOn(summary, '2026-11-12')).toEqual({
      date: '2026-11-12',
      paidAmount: 0,
      paidCount: 0,
    })
  })
})

const payment = (patch: Partial<AdminPaymentDto>): AdminPaymentDto => ({
  paymentId: 1,
  memberId: 1,
  orderId: 1,
  amount: 10000,
  refundedAmount: 0,
  status: 'COMPLETED',
  failureCode: null,
  paidAt: '2026-11-11T10:00:00',
  createdAt: '2026-11-11T10:00:00',
  ...patch,
})

describe('paymentSummaryOf: 목 결제 요약 (BE AdminPaymentController.getSummary 규칙)', () => {
  const payments = [
    payment({ paymentId: 1, amount: 10000, paidAt: '2026-11-11T00:00:00' }),
    // 환불돼도 환불 전 금액으로 센다
    payment({
      paymentId: 2,
      amount: 20000,
      refundedAmount: 20000,
      status: 'REFUNDED',
      paidAt: '2026-11-11T23:59:59',
    }),
    payment({
      paymentId: 3,
      amount: 5000,
      refundedAmount: 1000,
      status: 'PARTIALLY_REFUNDED',
      paidAt: '2026-11-09T12:00:00',
    }),
    // 실패 결제는 빼고, 결제일이 없다
    payment({
      paymentId: 4,
      status: 'FAILED',
      failureCode: 'INSUFFICIENT_BALANCE',
      paidAt: null,
      createdAt: '2026-11-11T09:00:00',
    }),
  ]

  it('기간의 날마다 한 줄, 결제 없는 날은 0, 오름차순 (양 끝 포함)', () => {
    expect(paymentSummaryOf(payments, '2026-11-10', '2026-11-11', '2026-11-12')).toEqual({
      daily: [
        { date: '2026-11-10', paidAmount: 0, paidCount: 0 },
        { date: '2026-11-11', paidAmount: 30000, paidCount: 2 },
      ],
      refundedPaymentCount: 2,
    })
  })
  it('둘 다 비우면 오늘 하루, from만 비우면 to 하루', () => {
    expect(paymentSummaryOf(payments, null, null, '2026-11-09').daily).toEqual([
      { date: '2026-11-09', paidAmount: 5000, paidCount: 1 },
    ])
    expect(paymentSummaryOf(payments, null, '2026-11-11', '2026-11-12').daily).toEqual([
      { date: '2026-11-11', paidAmount: 30000, paidCount: 2 },
    ])
  })
  it('달이 바뀌어도 날짜를 잇는다', () => {
    expect(
      paymentSummaryOf([], '2026-10-31', '2026-11-01', '2026-11-12').daily.map((day) => day.date),
    ).toEqual(['2026-10-31', '2026-11-01'])
  })
  it('환불 있는 결제 수는 기간과 상관없다', () => {
    expect(
      paymentSummaryOf(payments, '2026-01-01', '2026-01-01', '2026-11-12').refundedPaymentCount,
    ).toBe(2)
  })
})
