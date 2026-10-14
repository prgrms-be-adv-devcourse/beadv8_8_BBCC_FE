import type { AdminOrderDto } from '@/entities/order'
import type { AdminPaymentDto } from '@/entities/payment'
import { useApiFlowLog, type ApiCallLog, type MockHandler } from '@/shared/api'
import { page } from './mock-utils'

// 기획서 8장 관리자 "보완" 중 백엔드에 없는 전체 조회.
// 관리자 토큰으로는 남의 주문 · 결제를 읽을 수 없으므로, 이 탭에서 각 회원이 받은 응답(흐름 기록)으로 만든다

type Json = Record<string, unknown>
const isObj = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const ok = (log: ApiCallLog) => log.status !== null && log.status < 300

/** 흐름 기록의 주문 응답(주문하기 · 주문 상세) → 주문별 마지막 상태 */
export function ordersSeenInLogs(logs: ApiCallLog[]): AdminOrderDto[] {
  const orders = new Map<string, AdminOrderDto>()
  for (const log of logs) {
    const body = log.responseBody
    const path = log.path.split('?')[0]
    if (!ok(log) || !isObj(body) || !/^\/orders(\/[^/]+)?$/.test(path)) continue
    if (!('orderId' in body) || !Array.isArray(body.items)) continue
    orders.set(String(body.orderId), {
      orderId: String(body.orderId),
      memberId: Number(log.actor),
      status: String(body.status),
      cancelReason: (body.cancelReason as string | null) ?? null,
      totalAmount: Number(body.totalAmount),
      orderedAt: String(body.orderedAt),
      itemCount: body.items.length,
    })
  }
  return [...orders.values()].sort((a, b) => b.orderedAt.localeCompare(a.orderedAt))
}

/** 흐름 기록의 결제 목록 응답 → 결제별 마지막 값 + 회원 번호 */
export function paymentsSeenInLogs(logs: ApiCallLog[]): AdminPaymentDto[] {
  const payments = new Map<number, AdminPaymentDto>()
  for (const log of logs) {
    const body = log.responseBody
    if (!ok(log) || log.path.split('?')[0] !== '/payments' || !isObj(body)) continue
    for (const item of (body.content as AdminPaymentDto[] | undefined) ?? []) {
      payments.set(item.paymentId, { ...item, memberId: Number(log.actor) })
    }
  }
  return [...payments.values()].sort((a, b) => b.paymentId - a.paymentId)
}

export const adminHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: '/admin/orders',
    handle: (request) => {
      const status = request.query.get('status')
      const orders = ordersSeenInLogs(useApiFlowLog.getState().logs).filter(
        (order) => !status || order.status === status,
      )
      return { status: 200, data: page(orders, request) }
    },
  },
  {
    method: 'GET',
    path: '/admin/payments',
    handle: (request) => ({
      status: 200,
      data: page(paymentsSeenInLogs(useApiFlowLog.getState().logs), request),
    }),
  },
]
