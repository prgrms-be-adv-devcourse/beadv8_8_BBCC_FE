import type { OrderDetailDto } from '@/entities/order'
import type { SettlementDetailDto, SettlementTargetDto } from '@/entities/settlement'
import type { MockHandler, MockObserver } from '@/shared/api'
import { loadMockState, memberIdOf, now, page, problem, saveMockState } from './mock-utils'

const FEE_RATE = 0.1

// 정산 대상 = 실제 주문에서 구매확정된 주문상품 (아래 관찰자가 주문 상세 응답에서 옮겨 적는다)
const targets: (SettlementTargetDto & { sellerId: string })[] = loadMockState(
  'settlement-targets-v2',
  [],
)
const settlements: SettlementDetailDto[] = loadMockState<SettlementDetailDto[]>(
  'settlements-v2',
  [],
)
let nextSettlementId = settlements.length + 1

/** 목록 응답에는 상세(items)를 넣지 않는다 */
function withoutItems(settlement: SettlementDetailDto) {
  const copy: Partial<SettlementDetailDto> = { ...settlement }
  delete copy.items
  return copy
}

export const settlementHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: '/seller/settlement-targets',
    handle: (request) => ({
      status: 200,
      data: targets
        .filter((target) => target.sellerId === memberIdOf(request))
        .map((target) => {
          const copy: Partial<typeof target> = { ...target }
          delete copy.sellerId
          return copy
        }),
    }),
  },
  {
    method: 'GET',
    path: '/seller/settlements',
    handle: (request) => ({
      status: 200,
      data: page(
        settlements.filter((item) => item.sellerId === memberIdOf(request)).map(withoutItems),
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
    method: 'GET',
    path: '/admin/settlements',
    handle: (request) => ({ status: 200, data: page(settlements.map(withoutItems), request) }),
  },
  {
    method: 'POST',
    path: '/admin/settlements/:settlementId/retry',
    handle: (request) => {
      const settlement = settlements.find(
        (item) => item.settlementId === request.params.settlementId,
      )
      const instance = `/api/v1/admin/settlements/${request.params.settlementId}/retry`
      if (!settlement)
        return problem(404, '찾을 수 없습니다', '정산서를 찾을 수 없습니다.', instance)
      if (settlement.status !== 'FAILED')
        return problem(
          409,
          '재처리할 수 없습니다',
          '적립에 실패한 정산만 재처리할 수 있습니다.',
          instance,
        )
      // 같은 settlementId로 다시 적립 요청 → 이번에는 성공
      settlement.status = 'COMPLETED'
      settlement.settledAt = now()
      saveMockState('settlements-v2', settlements)
      return { status: 200, data: withoutItems(settlement) }
    },
  },
  {
    method: 'POST',
    path: '/admin/settlements/run',
    handle: (request) => {
      const body = request.body as { periodEnd?: string; simulatePayoutFailure?: boolean } | null
      const periodEnd = body?.periodEnd ?? now().slice(0, 10)
      const due = targets.filter(
        (target) => !target.settled && target.confirmedAt < `${periodEnd}T00:00:00`,
      )
      const created: SettlementDetailDto[] = []
      for (const sellerId of new Set(due.map((target) => target.sellerId))) {
        const mine = due.filter((target) => target.sellerId === sellerId)
        const totalAmount = mine.reduce((sum, target) => sum + target.amount, 0)
        const feeAmount = Math.floor(totalAmount * FEE_RATE)
        const settlement: SettlementDetailDto = {
          settlementId: String(nextSettlementId++),
          sellerId,
          period: { periodStart: null, periodEnd },
          itemCount: mine.length,
          totalAmount,
          feeRate: FEE_RATE,
          feeAmount,
          payoutAmount: totalAmount - feeAmount,
          // 목 옵션: 결제의 판매자 지갑 적립 실패를 흉내 (재처리 시연용)
          status: body?.simulatePayoutFailure ? 'FAILED' : 'COMPLETED',
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
      saveMockState('settlement-targets-v2', targets)
      saveMockState('settlements-v2', settlements)
      return {
        status: 200,
        data: {
          periodEnd,
          settlementCount: created.length,
          settlements: created.map(withoutItems),
        },
      }
    },
  },
]

/**
 * 주문 상세 실제 응답에서 구매확정된 주문상품을 정산 대상으로 옮긴다 (정산 API가 없어 구매확정 이벤트 대신).
 * 같은 주문상품은 한 번만 넣는다
 */
export const settlementObservers: MockObserver[] = [
  {
    method: 'GET',
    path: '/orders/:orderId',
    observe: (_request, response) => {
      if (response.status !== 200) return
      const order = response.data as OrderDetailDto
      let added = false
      for (const item of order.items ?? []) {
        if (item.status !== 'CONFIRMED' || !item.confirmedAt) continue
        if (targets.some((target) => target.orderItemId === String(item.orderItemId))) continue
        targets.push({
          targetId: String(targets.length + 1),
          orderItemId: String(item.orderItemId),
          productName: [item.productName, item.optionName].filter(Boolean).join(' '),
          amount: item.amount,
          confirmedAt: item.confirmedAt,
          settled: false,
          sellerId: String(item.sellerId),
        })
        added = true
      }
      if (added) saveMockState('settlement-targets-v2', targets)
    },
  },
]
