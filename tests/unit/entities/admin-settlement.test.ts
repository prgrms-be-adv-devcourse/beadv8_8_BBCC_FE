import { describe, expect, it } from 'vitest'
import {
  canRetrySettlementPayout,
  toAdminSettlement,
  toSettlementRunResult,
} from '@/entities/settlement'

const RUN = {
  runId: 7,
  cutoffAt: '2026-10-17T00:00:00',
  periodStartOn: '2026-10-01',
  periodEndOn: '2026-10-16',
  triggerType: 'SCHEDULED',
  status: 'PARTIAL_FAILED',
  successCount: 1,
  failCount: 1,
  requestedBy: null,
  startedAt: '2026-10-17T10:00:00',
  finishedAt: '2026-10-17T10:00:03',
}

describe('관리자 정산 (BE AdminSettlementController)', () => {
  it('정산서 목록 한 줄: 판매자 ID · 지급 실패 사유를 더한다 (ID는 문자열)', () => {
    expect(
      toAdminSettlement({
        settlementId: 1,
        sellerId: 9,
        periodStartOn: '2026-10-01',
        periodEndOn: '2026-10-16',
        totalSalesAmount: 25000,
        feeRate: 0.1,
        feeAmount: 2500,
        settlementAmount: 22500,
        status: 'FAILED',
        completedAt: '2026-10-17T10:00:00',
        paidAt: null,
        failReason: '예치금 계좌 없음',
      }),
    ).toMatchObject({
      id: '1',
      sellerId: '9',
      status: 'FAILED',
      payoutAmount: 22500,
      failReason: '예치금 계좌 없음',
    })
  })

  it('실행 결과: 건너뛴 판매자와 사유 (판매자 ID는 문자열)', () => {
    expect(
      toSettlementRunResult({
        ...RUN,
        skippedSellers: [
          { sellerId: 4, phase: 'PROCESS', reason: 'IllegalStateException: 금액 오류' },
        ],
      }).skippedSellers,
    ).toEqual([{ sellerId: '4', phase: 'PROCESS', reason: 'IllegalStateException: 금액 오류' }])
  })

  it('실행 결과: 건너뛴 판매자가 없으면 빈 목록', () => {
    expect(toSettlementRunResult({ ...RUN, skippedSellers: [] }).skippedSellers).toEqual([])
  })

  it('지급 재요청은 지급 결과를 받지 못한 정산서(COMPLETED)만 (BE validatePayoutRetryable)', () => {
    expect(canRetrySettlementPayout({ status: 'COMPLETED' })).toBe(true)
    expect(canRetrySettlementPayout({ status: 'PAID' })).toBe(false)
    expect(canRetrySettlementPayout({ status: 'FAILED' })).toBe(false)
  })
})
