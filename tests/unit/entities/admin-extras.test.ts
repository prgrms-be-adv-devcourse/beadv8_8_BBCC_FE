import { describe, expect, it } from 'vitest'
import { ordersSeenInLogs, paymentsSeenInLogs } from '@/app/mocks/admin-handlers'
import {
  canSuspendMember,
  canSuspendSeller,
  toAdminMember,
  type AdminMember,
} from '@/entities/member'
import { toAdminOrder } from '@/entities/order'
import { toAdminPayment } from '@/entities/payment'
import { toSettlement, toSettlementRunResult } from '@/entities/settlement'
import type { ApiCallLog } from '@/shared/api'
import { REASON_MAX, validateReason } from '@/shared/lib'

describe('validateReason: 정지 · 거절 사유 (백엔드 @NotBlank · 200자)', () => {
  it('비었거나 공백뿐이면 안내', () => {
    expect(validateReason(' ')).toBe('사유를 입력해 주세요.')
  })
  it('200자 통과 · 201자 안내 (경계)', () => {
    expect(REASON_MAX).toBe(200)
    expect(validateReason('가'.repeat(200))).toBeNull()
    expect(validateReason('가'.repeat(201))).toBe('사유는 200자까지예요.')
  })
})

const member = (patch: Partial<AdminMember> = {}): AdminMember => ({
  ...toAdminMember({
    id: 2,
    nickname: '테스트상점',
    status: 'ACTIVE',
    sellerStatus: 'ACTIVE',
    suspendReason: null,
    suspendedAt: null,
    createdAt: '2026-10-01T10:00:00',
  }),
  ...patch,
})

describe('관리자 회원 목록', () => {
  it('toAdminMember: 숫자 ID → 문자열', () => {
    expect(member().id).toBe('2')
  })
  it('이용 정지는 활동 중인 회원만', () => {
    expect(canSuspendMember(member())).toBe(true)
    expect(canSuspendMember(member({ status: 'SUSPENDED' }))).toBe(false)
  })
  it('판매자 자격 정지는 판매 가능한 판매자만 (판매자가 아니면 불가)', () => {
    expect(canSuspendSeller(member())).toBe(true)
    expect(canSuspendSeller(member({ sellerStatus: 'SUSPENDED' }))).toBe(false)
    expect(canSuspendSeller(member({ sellerStatus: null }))).toBe(false)
  })
})

describe('관리자 전체 주문 · 결제 · 정산', () => {
  it('toAdminOrder: 회원 번호 · 상품 수를 함께', () => {
    expect(
      toAdminOrder({
        orderId: '6',
        memberId: '1',
        status: 'PAID',
        cancelReason: null,
        totalAmount: 25000,
        orderedAt: '2026-10-15T10:00:00',
        itemCount: 1,
      }),
    ).toEqual({
      id: '6',
      memberId: '1',
      status: 'PAID',
      cancelReason: null,
      totalAmount: 25000,
      orderedAt: '2026-10-15T10:00:00',
      itemCount: 1,
    })
  })
  it('toAdminPayment: 회원 번호를 함께', () => {
    expect(
      toAdminPayment({
        paymentId: 3,
        orderId: 6,
        memberId: 1,
        amount: 25000,
        refundedAmount: 0,
        status: 'COMPLETED',
        failureCode: null,
        paidAt: '2026-10-15T10:00:02',
        createdAt: '2026-10-15T10:00:02',
      }),
    ).toMatchObject({ id: '3', orderId: '6', memberId: '1' })
  })
  it('정산서 (BE SettlementSummaryResponse): 숫자 ID → 문자열, 수수료율 → %', () => {
    expect(
      toSettlement({
        settlementId: 1,
        periodStartOn: '2026-10-01',
        periodEndOn: '2026-10-16',
        totalSalesAmount: 25000,
        feeRate: 0.1,
        feeAmount: 2500,
        settlementAmount: 22500,
        status: 'PAID',
        completedAt: '2026-10-16T10:00:00',
        paidAt: '2026-10-16T10:00:01',
      }),
    ).toMatchObject({ id: '1', status: 'PAID', feeRatePercent: 10, payoutAmount: 22500 })
  })
  it('정산 실행 기록: 성공 · 실패 수와 기간', () => {
    expect(
      toSettlementRunResult({
        runId: 7,
        cutoffAt: '2026-10-17T00:00:00',
        periodStartOn: '2026-10-01',
        periodEndOn: '2026-10-16',
        triggerType: 'MANUAL',
        status: 'COMPLETED',
        successCount: 1,
        failCount: 0,
        requestedBy: 3,
        startedAt: '2026-10-16T10:00:00',
        finishedAt: '2026-10-16T10:00:01',
      }),
    ).toEqual({
      runId: '7',
      status: 'COMPLETED',
      successCount: 1,
      failCount: 0,
      periodStart: '2026-10-01',
      periodEnd: '2026-10-16',
    })
  })
})

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
const orderBody = (status: string) => ({
  orderId: '6',
  status,
  cancelReason: null,
  totalAmount: 25000,
  orderedAt: '2026-10-15T10:00:00',
  items: [{}, {}],
  deliveries: [],
})

describe('목: 관리자 전체 조회는 이 탭에서 본 응답으로 만든다', () => {
  it('주문: 같은 주문은 마지막 상태로 하나, 회원은 호출한 사람', () => {
    const orders = ordersSeenInLogs([
      log({
        method: 'POST',
        path: '/orders',
        status: 201,
        responseBody: orderBody('PENDING_PAYMENT'),
      }),
      log({ path: '/orders/6', responseBody: orderBody('PAID') }),
      log({ path: '/orders/6', status: 500, responseBody: orderBody('CANCELLED') }),
    ])
    expect(orders).toEqual([
      {
        orderId: '6',
        memberId: '1',
        status: 'PAID',
        cancelReason: null,
        totalAmount: 25000,
        orderedAt: '2026-10-15T10:00:00',
        itemCount: 2,
      },
    ])
  })
  it('결제: 결제 목록 응답에서 결제별 마지막 값, 회원 번호를 붙인다', () => {
    const payment = {
      paymentId: 3,
      orderId: 6,
      amount: 25000,
      refundedAmount: 0,
      status: 'COMPLETED',
    }
    const payments = paymentsSeenInLogs([
      log({ actor: '1', path: '/payments', responseBody: { content: [payment] } }),
      log({
        actor: '1',
        path: '/payments',
        responseBody: { content: [{ ...payment, status: 'REFUNDED' }] },
      }),
    ])
    expect(payments).toHaveLength(1)
    expect(payments[0]).toMatchObject({ paymentId: 3, memberId: 1, status: 'REFUNDED' })
  })
})
