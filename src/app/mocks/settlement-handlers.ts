import type { Settlement, SettlementTarget } from '@/entities/settlement'
import type { MockHandler } from '@/shared/api'
import { loadMockState, memberIdOf, now, page, saveMockState } from './mock-utils'

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
const settlements: Settlement[] = loadMockState<Settlement[]>('settlements', [])
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
    method: 'POST',
    path: '/admin/settlements/run',
    handle: (request) => {
      const periodEnd =
        (request.body as { periodEnd?: string } | null)?.periodEnd ?? now().slice(0, 10)
      const due = targets.filter(
        (target) => !target.settled && target.confirmedAt < `${periodEnd}T00:00:00`,
      )
      const created: Settlement[] = []
      for (const sellerId of new Set(due.map((target) => target.sellerId))) {
        const mine = due.filter((target) => target.sellerId === sellerId)
        const totalAmount = mine.reduce((sum, target) => sum + target.amount, 0)
        const feeAmount = Math.floor(totalAmount * FEE_RATE)
        const settlement: Settlement = {
          settlementId: String(nextSettlementId++),
          sellerId,
          periodEnd,
          itemCount: mine.length,
          totalAmount,
          feeRate: FEE_RATE,
          feeAmount,
          payoutAmount: totalAmount - feeAmount,
          status: 'COMPLETED',
          settledAt: now(),
        }
        mine.forEach((target) => (target.settled = true))
        settlements.push(settlement)
        created.push(settlement)
      }
      saveMockState('settlement-targets', targets)
      saveMockState('settlements', settlements)
      return {
        status: 200,
        data: { periodEnd, settlementCount: created.length, settlements: created },
      }
    },
  },
]
