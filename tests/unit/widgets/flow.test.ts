import { describe, expect, it } from 'vitest'
import type { ApiCallLog } from '@/shared/api'
import { latestActionDomains } from '@/widgets/api-flow-panel/model/flow-view'
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

const order = (status: string) => ({
  orderId: '6',
  status,
  cancelReason: null,
  items: [],
  deliveries: [],
})

describe('상태 변화', () => {
  it('같은 주문의 상태가 바뀐 순간과 걸린 시간을 뽑는다', () => {
    const changes = deriveStateChanges([
      log({
        method: 'POST',
        path: '/orders',
        status: 201,
        responseBody: order('PENDING_PAYMENT'),
        startedAt: '2026-10-15T10:00:00.000Z',
      }),
      log({
        path: '/orders/6',
        responseBody: order('PENDING_PAYMENT'),
        startedAt: '2026-10-15T10:00:01.000Z',
      }),
      log({
        path: '/orders/6',
        responseBody: order('PAID'),
        startedAt: '2026-10-15T10:00:02.500Z',
      }),
    ])
    expect(changes.filter((change) => change.from !== null)).toEqual([
      expect.objectContaining({
        resource: '주문 #6',
        from: 'PENDING_PAYMENT',
        to: 'PAID',
        elapsedMs: 2500,
      }),
    ])
  })
  it('잔액은 회원별로 따로 본다', () => {
    const changes = deriveStateChanges([
      log({ path: '/wallets/me', actor: '1', responseBody: { balance: 100000 } }),
      log({ path: '/wallets/me', actor: '2', responseBody: { balance: 0 } }),
      log({ path: '/wallets/me', actor: '1', responseBody: { balance: 75000 } }),
    ])
    expect(changes.filter((change) => change.from !== null)).toEqual([
      expect.objectContaining({
        resource: '예치금 잔액 (회원 1)',
        from: '100,000원',
        to: '75,000원',
      }),
    ])
  })
  it('실패한 응답은 상태로 보지 않는다', () => {
    expect(
      deriveStateChanges([log({ path: '/wallets/me', status: 404, responseBody: { balance: 1 } })]),
    ).toEqual([])
  })
})

describe('도메인 흐름도', () => {
  it('마지막 행동의 호출 도메인과 이벤트로 이어진 도메인을 표시한다 (배경 조회는 건너뜀)', () => {
    const { called, followed } = latestActionDomains([
      log({ action: '주문하기', method: 'POST', path: '/orders', status: 201 }),
      log({ action: null, path: '/orders/6' }),
    ])
    expect([...called]).toEqual(['order'])
    expect([...followed].sort()).toEqual(['order', 'payment', 'product'])
  })
})

describe('흐름 확인 판정', () => {
  const check = (checkId: string) => VERIFICATION_CHECKS.find((item) => item.id === checkId)!

  it('결제 완료: 주문 상세가 PAID면 통과', () => {
    expect(
      evaluate(check('order-paid'), [log({ path: '/orders/6', responseBody: order('PAID') })])
        .state,
    ).toBe('pass')
  })
  it('결제 완료: 처리 중만 보였으면 실패로 남는다', () => {
    expect(
      evaluate(check('order-paid'), [
        log({ path: '/orders/6', responseBody: order('PENDING_PAYMENT') }),
      ]).state,
    ).toBe('fail')
  })
  it('호출이 없으면 대기', () => {
    expect(evaluate(check('order-paid'), []).state).toBe('waiting')
  })
  it('목으로 통과하면 표시한다', () => {
    expect(
      evaluate(check('product-start'), [
        log({ method: 'POST', path: '/seller/products/1/start-sale', mock: true }),
      ]),
    ).toMatchObject({
      state: 'pass',
      byMock: true,
    })
  })
  it('보호자 잔액 감소: 같은 회원 잔액이 줄면 통과', () => {
    const result = evaluate(check('buyer-balance'), [
      log({ path: '/wallets/me', actor: '1', responseBody: { balance: 100000 } }),
      log({ path: '/wallets/me', actor: '1', responseBody: { balance: 75000 } }),
    ])
    expect(result).toMatchObject({ state: 'pass', evidence: '100,000 → 75,000원' })
  })
})

describe('흐름 확인: 결제 완료 지연 근거', () => {
  const check = VERIFICATION_CHECKS.find((item) => item.id === 'order-paid')!
  const at = (second: number) =>
    `2026-10-15T10:${String(Math.floor(second / 60)).padStart(2, '0')}:${String(second % 60).padStart(2, '0')}.000Z`

  it('같은 주문이 30초 넘게 결제 처리 중이면 지연 시간과 원인 후보를 남긴다', () => {
    const result = evaluate(check, [
      log({ path: '/orders/6', startedAt: at(0), responseBody: order('PENDING_PAYMENT') }),
      log({ path: '/orders/6', startedAt: at(45), responseBody: order('PENDING_PAYMENT') }),
    ])
    expect(result.state).toBe('fail')
    expect(result.evidence).toMatch(/주문 #6 결제 처리 중 45초째/)
    expect(result.evidence).toMatch(/stock\.deducted/)
  })

  it('30초 전이면 지연이라고 하지 않는다 (경계)', () => {
    const result = evaluate(check, [
      log({ path: '/orders/6', startedAt: at(0), responseBody: order('PENDING_PAYMENT') }),
      log({ path: '/orders/6', startedAt: at(29), responseBody: order('PENDING_PAYMENT') }),
    ])
    expect(result.state).toBe('fail')
    expect(result.evidence).not.toMatch(/초째/)
  })

  it('나중에 PAID가 보이면 통과', () => {
    expect(
      evaluate(check, [
        log({ path: '/orders/6', startedAt: at(0), responseBody: order('PENDING_PAYMENT') }),
        log({ path: '/orders/6', startedAt: at(45), responseBody: order('PAID') }),
      ]).state,
    ).toBe('pass')
  })
})
