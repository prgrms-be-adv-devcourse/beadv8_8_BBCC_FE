import { describe, expect, it } from 'vitest'
import type { ApiCallLog } from '@/shared/api'
import { domainOf } from '@/widgets/api-flow-panel/config/domain-flow'
import { deriveStateChanges } from '@/widgets/api-flow-panel/model/state-changes'
import { VERIFICATION_CHECKS } from '@/widgets/verification-checklist/config/checks'
import { evaluate } from '@/widgets/verification-checklist/model/evaluate'

let id = 0
const log = (patch: Partial<ApiCallLog>): ApiCallLog => ({
  id: ++id,
  action: null,
  actor: '1',
  method: 'GET',
  path: '/',
  status: 200,
  durationMs: 10,
  startedAt: `2026-10-15T10:00:0${id % 10}.000Z`,
  mock: false,
  requestBody: null,
  responseBody: null,
  contractIssues: [],
  ...patch,
})
const paymentPage = (...content: object[]) => ({
  content,
  page: 0,
  size: 20,
  totalElements: content.length,
  totalPages: 1,
  hasNext: false,
})
const completed = {
  paymentId: 3,
  orderId: 6,
  amount: 25000,
  refundedAmount: 0,
  status: 'COMPLETED',
}
const paidOrder = { orderId: '6', status: 'PAID', totalAmount: 25000, items: [], deliveries: [] }

describe('결제 API 흐름 표시', () => {
  it('결제 내역 API는 결제 도메인이다', () => {
    expect(domainOf('/payments')).toBe('payment')
    expect(domainOf('/payments/3')).toBe('payment')
  })

  it('상태 변화: 결제 목록에서 주문별 결제 상태를 본다', () => {
    const changes = deriveStateChanges([
      log({ path: '/payments', responseBody: paymentPage() }),
      log({ path: '/payments', responseBody: paymentPage(completed) }),
    ])
    expect(changes.map((change) => `${change.resource}: ${change.to}`)).toContain(
      '결제 (주문 #6): COMPLETED',
    )
  })
})

describe('흐름 확인: 결제 도메인 결제 기록', () => {
  const check = VERIFICATION_CHECKS.find((item) => item.id === 'payment-record')!

  it('결제 완료 주문과 같은 금액의 COMPLETED 결제가 보이면 통과', () => {
    const result = evaluate(check, [
      log({ path: '/orders/6', responseBody: paidOrder }),
      log({ path: '/payments', responseBody: paymentPage(completed) }),
    ])
    expect(result.state).toBe('pass')
    expect(result.evidence).toMatch(/주문 #6.*결제 #3/)
  })

  it('결제 완료 주문인데 결제 목록에 없으면 실패', () => {
    expect(
      evaluate(check, [
        log({ path: '/orders/6', responseBody: paidOrder }),
        log({ path: '/payments', responseBody: paymentPage() }),
      ]).state,
    ).toBe('fail')
  })

  it('금액이 다르면 실패', () => {
    expect(
      evaluate(check, [
        log({ path: '/orders/6', responseBody: paidOrder }),
        log({ path: '/payments', responseBody: paymentPage({ ...completed, amount: 20000 }) }),
      ]).state,
    ).toBe('fail')
  })

  it('결제 완료 주문이나 결제 목록 조회가 없으면 대기', () => {
    expect(evaluate(check, [log({ path: '/orders/6', responseBody: paidOrder })]).state).toBe(
      'waiting',
    )
    expect(evaluate(check, []).state).toBe('waiting')
  })
})

describe('상태 변화: 충전 내역 목록', () => {
  it('충전 목록 응답에서 충전별 상태를 본다', () => {
    const changes = deriveStateChanges([
      log({
        path: '/wallets/me/charges',
        responseBody: { content: [{ chargeId: 7, status: 'DONE' }] },
      }),
      log({
        path: '/wallets/me/charges',
        responseBody: { content: [{ chargeId: 7, status: 'CANCELLED' }] },
      }),
    ])
    expect(changes.map((change) => `${change.resource}: ${change.from} → ${change.to}`)).toContain(
      '충전 #7: DONE → CANCELLED',
    )
  })
})
