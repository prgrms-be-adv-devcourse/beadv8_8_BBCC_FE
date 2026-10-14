import type { SettlementDetail, SettlementTarget } from '@/entities/settlement'
import type { MockHandler } from '@/shared/api'
import { loadMockState, memberIdOf, now, page, problem, saveMockState } from './mock-utils'

const FEE_RATE = 0.1

// 기획서 7.1 카드별 추가 데이터: 판매자 2의 정산 대상 1건 (25,000원)
const targets: (SettlementTarget & { sellerId: string })[] = loadMockState('settlement-targets', [
  {
    targetId: '1',
    orderItemId: '1',
    productName: '데일리 맨투맨 (상품 A) 110',
    amount: 25000,
    confirmedAt: '2026-10-13T10:00:00',
    settled: false,
    sellerId: '2',
  },
])
const settlements: SettlementDetail[] = loadMockState<SettlementDetail[]>('settlements-v2', [])
let nextSettlementId = settlements.length + 1

export const settlementHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: '/seller/settlement-targets',
    handle: (request) => ({
      status: 200,
      data: targets.filter((target) => target.sellerId === memberIdOf(request)),
    }),
  },
  {
    method: 'GET',
    path: '/seller/settlements',
    handle: (request) => ({
      status: 200,
      data: page(
        settlements.filter((item) => item.sellerId === memberIdOf(request)),
        request,
      ),
    }),
  },
  {
    method: 'GET',
    path: '/seller/settlements/:settlementId',
    handle: (request) => {
      const settlement = settlements.find(
        (item) =>
          item.settlementId === request.params.settlementId &&
          item.sellerId === memberIdOf(request),
      )
      return settlement
        ? { status: 200, data: settlement }
        : problem(
            404,
            '찾을 수 없습니다',
            '정산서를 찾을 수 없습니다.',
            `/api/v1/seller/settlements/${request.params.settlementId}`,
          )
    },
  },
  {
    method: 'POST',
    path: '/admin/settlements/run',
    handle: (request) => {
      const periodEnd =
        (request.body as { periodEnd?: string } | null)?.periodEnd ?? now().slice(0, 10)
      const due = targets.filter(
        (target) => !target.settled && target.confirmedAt < `${periodEnd}T00:00:00`,
      )
      const created: SettlementDetail[] = []
      for (const sellerId of new Set(due.map((target) => target.sellerId))) {
        const mine = due.filter((target) => target.sellerId === sellerId)
        const totalAmount = mine.reduce((sum, target) => sum + target.amount, 0)
        const feeAmount = Math.floor(totalAmount * FEE_RATE)
        const settlement: SettlementDetail = {
          settlementId: String(nextSettlementId++),
          sellerId,
          period: { periodStart: null, periodEnd },
          itemCount: mine.length,
          totalAmount,
          feeRate: FEE_RATE,
          feeAmount,
          payoutAmount: totalAmount - feeAmount,
          status: 'COMPLETED',
          settledAt: now(),
          items: mine.map((target) => ({
            orderItemId: target.orderItemId,
            productName: target.productName,
            amount: target.amount,
            confirmedAt: target.confirmedAt,
          })),
        }
        mine.forEach((target) => (target.settled = true))
        settlements.push(settlement)
        created.push(settlement)
      }
      saveMockState('settlement-targets', targets)
      saveMockState('settlements-v2', settlements)
      return {
        status: 200,
        data: { periodEnd, settlementCount: created.length, settlements: created },
      }
    },
  },
]
