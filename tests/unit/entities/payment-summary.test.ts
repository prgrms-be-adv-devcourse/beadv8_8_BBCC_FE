import { describe, expect, it } from 'vitest'
import { paidOn, toAdminPaymentSummary } from '@/entities/payment'

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
