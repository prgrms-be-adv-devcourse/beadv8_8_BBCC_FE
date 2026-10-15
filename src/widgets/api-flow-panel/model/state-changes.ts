import type { ApiCallLog } from '@/shared/api'

/**
 * 응답에 보이는 서버 상태가 바뀐 순간을 뽑는다 (예: 주문 #6 PENDING_PAYMENT → PAID, 1.2초).
 * 주문 결제처럼 서버 이벤트로 이어지는 처리는 화면에서 결과 상태 변화로만 보이므로, 그 변화와 걸린 시간을 보여 준다.
 */
export type StateChange = {
  logId: number
  at: string
  resource: string
  from: string | null
  to: string
  /** 이전 값을 처음 본 뒤 새 값을 처음 볼 때까지 (ms) */
  elapsedMs: number | null
}

type Observation = { resource: string; value: string }

type Json = Record<string, unknown>
const isObj = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function observeOrder(order: Json): Observation[] {
  const id = String(order.orderId)
  const status = order.cancelReason
    ? `${order.status} (${order.cancelReason})`
    : String(order.status)
  const result: Observation[] = [{ resource: `주문 #${id}`, value: status }]
  for (const delivery of (order.deliveries as Json[] | undefined) ?? []) {
    result.push({
      resource: `주문 #${id} · 판매자 ${delivery.sellerId} 배송`,
      value: String(delivery.status),
    })
  }
  for (const item of (order.items as Json[] | undefined) ?? []) {
    result.push({ resource: `주문상품 #${item.orderItemId}`, value: String(item.status) })
  }
  return result
}

/** 경로 · 응답 → 관찰한 상태들 */
function observe(log: ApiCallLog): Observation[] {
  const body = log.responseBody
  const path = log.path.split('?')[0]
  if (log.status === null || log.status >= 400 || !isObj(body)) {
    return []
  }
  const who = log.actor ? `회원 ${log.actor}` : '비로그인'
  if (path === '/wallets/me') {
    return [
      {
        resource: `예치금 잔액 (${who})`,
        value: Number(body.balance).toLocaleString('ko-KR') + '원',
      },
    ]
  }
  if (/^\/orders(\/[^/]+)?$/.test(path) && 'orderId' in body && 'items' in body) {
    return observeOrder(body)
  }
  if (path === '/seller/orders' && Array.isArray(body.content)) {
    return (body.content as Json[]).map((order) => ({
      resource: `판매 주문 #${order.sellerOrderId}`,
      value: String(order.status),
    }))
  }
  if (path === '/wallets/me/charges' && Array.isArray(body.content)) {
    return (body.content as Json[]).map((item) => ({
      resource: `충전 #${item.chargeId}`,
      value: String(item.status),
    }))
  }
  if (/^\/wallets\/me\/charges\/[^/]+$/.test(path) && 'chargeId' in body) {
    return [{ resource: `충전 #${body.chargeId}`, value: String(body.status) }]
  }
  if (path === '/members/me/seller-application' && 'status' in body) {
    return [{ resource: `판매자 신청 #${body.id}`, value: String(body.status) }]
  }
  if (path === '/admin/seller-applications' && Array.isArray(body.content)) {
    return (body.content as Json[]).map((item) => ({
      resource: `판매자 신청 #${item.id}`,
      value: String(item.status),
    }))
  }
  if (path === '/payments' && Array.isArray(body.content)) {
    return (body.content as Json[]).map((item) => ({
      resource: `결제 (주문 #${item.orderId})`,
      value: String(item.status),
    }))
  }
  const saleStatus = /^\/seller\/products\/([^/]+)\/sale-status$/.exec(path)
  if (saleStatus && typeof body.status === 'string') {
    return [{ resource: `상품 #${saleStatus[1]}`, value: body.status }]
  }
  if (path === '/seller/products' && log.method === 'POST' && typeof body.productId === 'string') {
    return [{ resource: `상품 #${body.productId}`, value: String(body.status) }]
  }
  if (path === '/seller/products' && Array.isArray(body.content)) {
    return (body.content as Json[]).map((item) => ({
      resource: `상품 #${item.productId}`,
      value: String(item.status),
    }))
  }
  return []
}

export function deriveStateChanges(logs: ApiCallLog[]): StateChange[] {
  const last = new Map<string, { value: string; firstSeenAt: number }>()
  const changes: StateChange[] = []
  for (const log of logs) {
    const at = new Date(log.startedAt).getTime()
    for (const { resource, value } of observe(log)) {
      const previous = last.get(resource)
      if (previous?.value === value) {
        continue
      }
      changes.push({
        logId: log.id,
        at: log.startedAt,
        resource,
        from: previous?.value ?? null,
        to: value,
        elapsedMs: previous ? at - previous.firstSeenAt : null,
      })
      last.set(resource, { value, firstSeenAt: at })
    }
  }
  return changes
}
