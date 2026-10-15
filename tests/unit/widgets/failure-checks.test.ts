import { describe, expect, it } from 'vitest'
import type { ApiCallLog } from '@/shared/api'
import { FAILURE_CHECKS } from '@/widgets/verification-checklist/config/checks'
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
  startedAt: '2026-10-15T10:00:00.000Z',
  mock: false,
  requestBody: null,
  responseBody: null,
  contractIssues: [],
  ...patch,
})
const order = (orderId: string, status: string, cancelReason: string | null) => ({
  orderId,
  status,
  cancelReason,
  totalAmount: 200000,
  items: [],
  deliveries: [],
})
const check = (checkId: string) => FAILURE_CHECKS.find((item) => item.id === checkId)!

describe('흐름 확인: 취소 · 실패 시나리오 (기획서 2.1)', () => {
  it('시나리오는 4개, 정상 흐름 판정과 따로 센다', () => {
    expect(FAILURE_CHECKS.map((item) => item.id)).toEqual([
      'cancel-payment-failed',
      'payment-failed-record',
      'cancel-out-of-stock',
      'cancel-expired',
    ])
  })

  it('잔액 부족: 주문 상세가 CANCELLED(PAYMENT_FAILED)면 통과', () => {
    expect(
      evaluate(check('cancel-payment-failed'), [
        log({ path: '/orders/9', responseBody: order('9', 'CANCELLED', 'PAYMENT_FAILED') }),
      ]).state,
    ).toBe('pass')
  })
  it('잔액 부족: 다른 이유로 취소된 주문만 있으면 대기', () => {
    expect(
      evaluate(check('cancel-payment-failed'), [
        log({ path: '/orders/9', responseBody: order('9', 'CANCELLED', 'OUT_OF_STOCK') }),
      ]).state,
    ).toBe('waiting')
  })

  it('결제 실패 기록: 잔액 부족으로 취소된 주문의 FAILED(INSUFFICIENT_BALANCE) 결제가 있으면 통과', () => {
    const result = evaluate(check('payment-failed-record'), [
      log({ path: '/orders/9', responseBody: order('9', 'CANCELLED', 'PAYMENT_FAILED') }),
      log({
        path: '/payments',
        responseBody: {
          content: [
            {
              paymentId: 4,
              orderId: 9,
              amount: 200000,
              status: 'FAILED',
              failureCode: 'INSUFFICIENT_BALANCE',
            },
          ],
        },
      }),
    ])
    expect(result.state).toBe('pass')
    expect(result.evidence).toMatch(/주문 #9 ↔ 결제 #4 FAILED/)
  })
  it('결제 실패 기록: 다른 회원이 나중에 조회한 결제 목록과 섞지 않는다', () => {
    const failed = {
      paymentId: 4,
      orderId: 9,
      amount: 200000,
      status: 'FAILED',
      failureCode: 'INSUFFICIENT_BALANCE',
    }
    expect(
      evaluate(check('payment-failed-record'), [
        log({
          actor: '1',
          path: '/orders/9',
          responseBody: order('9', 'CANCELLED', 'PAYMENT_FAILED'),
        }),
        log({ actor: '1', path: '/payments', responseBody: { content: [failed] } }),
        log({ actor: '3', path: '/payments', responseBody: { content: [] } }),
      ]).state,
    ).toBe('pass')
  })
  it('결제 실패 기록: 결제 목록에 없으면 실패', () => {
    expect(
      evaluate(check('payment-failed-record'), [
        log({ path: '/orders/9', responseBody: order('9', 'CANCELLED', 'PAYMENT_FAILED') }),
        log({ path: '/payments', responseBody: { content: [] } }),
      ]).state,
    ).toBe('fail')
  })

  it('재고 부족 · 시간 초과: 해당 이유로 취소된 주문이 보이면 통과', () => {
    expect(
      evaluate(check('cancel-out-of-stock'), [
        log({ path: '/orders/10', responseBody: order('10', 'CANCELLED', 'OUT_OF_STOCK') }),
      ]).state,
    ).toBe('pass')
    expect(
      evaluate(check('cancel-expired'), [
        log({ path: '/orders/11', responseBody: order('11', 'CANCELLED', 'PAYMENT_EXPIRED') }),
      ]).state,
    ).toBe('pass')
  })
})
