import { describe, expect, it } from 'vitest'
import type { ApiCallLog } from '@/shared/api'
import { domainOf, flowOf } from '@/widgets/api-flow-panel/config/domain-flow'
import { latestTimeline } from '@/widgets/api-flow-panel/model/event-timeline'
import { isKeyCall } from '@/widgets/api-flow-panel/model/presentation-mode'
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
  it('주문하기 뒤 아직 결제 처리 중이면 첫 이벤트만 끝나고 나머지는 기다림', () => {
    const timeline = latestTimeline(
      [
        log({
          action: '주문하기',
          method: 'POST',
          path: '/orders',
          status: 201,
          responseBody: order('PENDING_PAYMENT'),
        }),
        log({ action: null, path: '/orders/6', responseBody: order('PENDING_PAYMENT') }),
      ],
      domainOf,
    )!
    expect(timeline.origin).toBe('order')
    expect(timeline.steps.map((step) => [step.name, step.state])).toEqual([
      ['order.created', 'done'],
      ['stock.deducted', 'pending'],
      ['order.payment-requested', 'pending'],
      ['payment.completed', 'pending'],
    ])
    expect(timeline.outcome?.tone).toBe('pending')
  })
  it('결제 완료면 모두 끝남 + 걸린 시간', () => {
    const timeline = latestTimeline(
      [
        log({
          action: '주문하기',
          method: 'POST',
          path: '/orders',
          status: 201,
          responseBody: order('PENDING_PAYMENT'),
          startedAt: '2026-10-15T10:00:00.000Z',
        }),
        log({
          path: '/orders/6',
          responseBody: order('PAID'),
          startedAt: '2026-10-15T10:00:02.500Z',
        }),
      ],
      domainOf,
    )!
    expect(timeline.steps.every((step) => step.state === 'done')).toBe(true)
    expect(timeline.outcome).toEqual({ tone: 'success', text: '결제 완료 · 2.5초' })
  })
  it('잔액 부족 취소: 결제 실패 → 주문 취소 → 재고 복구(보상)', () => {
    const timeline = latestTimeline(
      [
        log({
          action: '주문하기',
          method: 'POST',
          path: '/orders',
          status: 201,
          responseBody: order('PENDING_PAYMENT'),
        }),
        log({
          path: '/orders/6',
          responseBody: { ...order('CANCELLED'), cancelReason: 'PAYMENT_FAILED' },
        }),
      ],
      domainOf,
    )!
    expect(timeline.steps.slice(-2).map((step) => [step.name, step.state])).toEqual([
      ['payment.failed', 'failed'],
      ['order.cancelled', 'compensate'],
    ])
  })
  it('재고 부족 취소: 재고 차감 실패에서 멈춘다', () => {
    const timeline = latestTimeline(
      [
        log({
          action: '주문하기',
          method: 'POST',
          path: '/orders',
          status: 201,
          responseBody: order('PENDING_PAYMENT'),
        }),
        log({
          path: '/orders/6',
          responseBody: { ...order('CANCELLED'), cancelReason: 'OUT_OF_STOCK' },
        }),
      ],
      domainOf,
    )!
    expect(timeline.steps.map((step) => step.name)).toEqual([
      'order.created',
      'stock.deduction-failed',
    ])
  })
  it('배경 호출만 있으면 그림 없음, 다른 행동은 설계 기준 단계 그대로', () => {
    expect(latestTimeline([log({ path: '/orders/6' })], domainOf)).toBeNull()
    const timeline = latestTimeline(
      [log({ action: '판매 시작', method: 'PUT', path: '/seller/products/7/sale-status' })],
      domainOf,
    )!
    expect(timeline.steps.map((step) => [step.name, step.to])).toEqual([
      ['product.changed', ['recommend', 'order']],
    ])
  })
  it('발표 모드: 역할 전환 · 예상된 응답 · 배경 조회는 숨기고 행동 호출과 실패는 보인다', () => {
    expect(isKeyCall(log({ action: '주문하기', method: 'POST', path: '/orders' }))).toBe(true)
    expect(
      isKeyCall(log({ action: '역할 전환: 보호자', method: 'POST', path: '/dev/tokens' })),
    ).toBe(false)
    expect(isKeyCall(log({ path: '/members/me', status: 404, expectedReason: '역할 전환' }))).toBe(
      false,
    )
    expect(isKeyCall(log({ path: '/orders/6' }))).toBe(false)
    expect(isKeyCall(log({ path: '/orders/6', status: 500 }))).toBe(true)
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
      evaluate(check('product-register'), [
        log({ method: 'POST', path: '/seller/products', mock: true }),
      ]),
    ).toMatchObject({
      state: 'pass',
      byMock: true,
    })
  })
  it('판매 시작: PUT sale-status 응답이 ON_SALE이면 통과', () => {
    expect(
      evaluate(check('product-start'), [
        log({
          method: 'PUT',
          path: '/seller/products/7/sale-status',
          responseBody: { productId: '7', status: 'ON_SALE', version: 1 },
        }),
      ]),
    ).toMatchObject({ state: 'pass', byMock: false })
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

describe('domainOf: 상품 도메인 경로', () => {
  it('카테고리 · 관리자 상품도 상품 도메인', () => {
    expect(domainOf('/categories')).toBe('product')
    expect(domainOf('/categories/3/attributes')).toBe('product')
    expect(domainOf('/admin/products/1/stop-sale')).toBe('product')
  })
  it('상품 이미지 업로드 주소 발급도 상품 도메인', () => {
    expect(domainOf('/seller/product-images/upload-urls')).toBe('product')
  })
})

describe('S3: 브라우저가 직접 올리는 외부 저장소', () => {
  it.each([
    'https://team04-kidly-s3.s3.ap-northeast-2.amazonaws.com/dev/products/7/a.jpg',
    'mock-upload://dev/products/7/a.jpg',
  ])('업로드 주소 %s는 S3', (path) => {
    expect(domainOf(path)).toBe('s3')
  })
  it('업로드 주소 발급 뒤 서버는 서명만 하고 브라우저가 S3에 직접 올린다 (설계 기준)', () => {
    expect(flowOf('POST', '/seller/product-images/upload-urls')).toMatchObject([
      { from: 'product', to: ['s3'], kind: 'external' },
    ])
  })
})
