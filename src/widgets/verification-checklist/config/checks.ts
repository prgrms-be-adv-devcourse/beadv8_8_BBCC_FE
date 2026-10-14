import { isPaymentDelayed } from '@/entities/order'
import type { ApiCallLog } from '@/shared/api'
import { paths } from '@/shared/config'

// 기획서 v1.0 7장 단계별 완료 기준을 "어떤 API가 어떤 결과를 돌려주면 통과"로 옮긴 체크리스트

type Body = Record<string, unknown>
const body = (log: ApiCallLog) => (log.responseBody ?? {}) as Body
const ok2xx = (log: ApiCallLog) => log.status !== null && log.status >= 200 && log.status < 300

export type CallCheck = {
  method: string
  pattern: RegExp
  /** 응답이 기대와 맞는지 (없으면 2xx면 통과) */
  expect?: (log: ApiCallLog) => boolean
}

/** 여러 호출을 비교해야 하는 확인 (예: 잔액이 줄었는지). 판단할 수 없으면 null */
export type LogsCheck = (logs: ApiCallLog[]) => { pass: boolean; evidence: string } | null

export type VerificationCheck = {
  id: string
  step: string
  title: string
  /** 통과 조건 설명 */
  expected: string
  role: '보호자' | '판매자' | '관리자'
  screen: string
  call?: CallCheck
  logs?: LogsCheck
}

/** 같은 회원의 잔액 조회 두 번을 비교한다 */
function balanceChange(actor: string, direction: 'down' | 'up'): LogsCheck {
  return (logs) => {
    const balances = logs
      .filter((log) => log.path === '/wallets/me' && log.actor === actor && ok2xx(log))
      .map((log) => Number(body(log).balance))
    for (let i = 1; i < balances.length; i++) {
      const before = balances[i - 1]
      const after = balances[i]
      if (direction === 'down' ? after < before : after > before) {
        return { pass: true, evidence: `${before.toLocaleString()} → ${after.toLocaleString()}원` }
      }
    }
    return null
  }
}

/** 결제 완료(PAID)로 본 주문이 결제 도메인 목록(GET /payments)에 같은 금액의 COMPLETED로 있는지 */
const paymentRecorded: LogsCheck = (logs) => {
  const paidOrders = new Map<string, number>()
  for (const log of logs) {
    const order = body(log)
    if (
      log.method === 'GET' &&
      /^\/orders\/[^/]+$/.test(log.path) &&
      ok2xx(log) &&
      order.status === 'PAID'
    ) {
      paidOrders.set(String(order.orderId), Number(order.totalAmount))
    }
  }
  const paymentsLog = logs.findLast(
    (log) => log.method === 'GET' && log.path.split('?')[0] === '/payments' && ok2xx(log),
  )
  if (paidOrders.size === 0 || !paymentsLog) return null
  const payments = ((body(paymentsLog).content as Body[] | undefined) ?? []).map((item) => ({
    id: String(item.paymentId),
    orderId: String(item.orderId),
    amount: Number(item.amount),
    status: String(item.status),
  }))
  const won = (value: number) => `${value.toLocaleString('ko-KR')}원`
  const problems: string[] = []
  for (const [orderId, total] of paidOrders) {
    const payment = payments.find((item) => item.orderId === orderId)
    if (payment?.status === 'COMPLETED' && payment.amount === total) {
      return {
        pass: true,
        evidence: `주문 #${orderId} ${won(total)} ↔ 결제 #${payment.id} COMPLETED ${won(payment.amount)}`,
      }
    }
    problems.push(
      payment
        ? `주문 #${orderId} ${won(total)} ↔ 결제 #${payment.id} ${payment.status} ${won(payment.amount)}`
        : `결제 완료 주문 #${orderId}이 결제 목록에 없음`,
    )
  }
  return { pass: false, evidence: problems.join(' / ') }
}

/**
 * 주문 상세가 PAID면 통과. 결제 처리 중만 보였으면 실패로 남기고,
 * 같은 주문이 30초 넘게 처리 중이면 서버 이벤트가 오지 않는다는 근거를 남긴다
 */
const orderPaid: LogsCheck = (logs) => {
  const orderLogs = logs.filter(
    (log) => log.method === 'GET' && /^\/orders\/[^/]+$/.test(log.path.split('?')[0]) && ok2xx(log),
  )
  if (orderLogs.length === 0) return null
  const time = (log: ApiCallLog) => log.startedAt.slice(11, 19)
  const paid = orderLogs.findLast((log) => body(log).status === 'PAID')
  if (paid) return { pass: true, evidence: `${time(paid)} GET ${paid.path} → PAID` }

  const pending = new Map<string, { first: number; last: number }>()
  for (const log of orderLogs) {
    if (body(log).status !== 'PENDING_PAYMENT') continue
    const id = String(body(log).orderId)
    const at = new Date(log.startedAt).getTime()
    const span = pending.get(id)
    pending.set(id, { first: span?.first ?? at, last: at })
  }
  const [longestId, longest] = [...pending].sort(
    ([, a], [, b]) => b.last - b.first - (a.last - a.first),
  )[0] ?? [null, null]
  if (longestId && longest && isPaymentDelayed(longest.last - longest.first)) {
    const seconds = Math.round((longest.last - longest.first) / 1000)
    return {
      pass: false,
      evidence: `주문 #${longestId} 결제 처리 중 ${seconds}초째 — 서버 이벤트(order.created → stock.deducted → 결제)가 오지 않음`,
    }
  }
  const last = orderLogs.at(-1)!
  return { pass: false, evidence: `${time(last)} GET ${last.path} → ${String(body(last).status)}` }
}

export const VERIFICATION_CHECKS: VerificationCheck[] = [
  {
    id: 'child',
    step: '①',
    title: '자녀 등록',
    expected: 'POST /children 2xx',
    role: '보호자',
    screen: paths.console.children,
    call: { method: 'POST', pattern: /^\/children$/ },
  },
  {
    id: 'child-list',
    step: '①',
    title: '자녀 목록에 보임',
    expected: 'GET /children 결과 1명 이상',
    role: '보호자',
    screen: paths.console.children,
    call: {
      method: 'GET',
      pattern: /^\/children$/,
      expect: (log) => Array.isArray(log.responseBody) && log.responseBody.length > 0,
    },
  },
  {
    id: 'address',
    step: '①',
    title: '배송지 등록',
    expected: 'POST /members/me/addresses 2xx',
    role: '보호자',
    screen: paths.console.addresses,
    call: { method: 'POST', pattern: /^\/members\/me\/addresses$/ },
  },
  {
    id: 'address-default',
    step: '①',
    title: '기본 배송지 1개',
    expected: '목록에 isDefault=true가 정확히 1개',
    role: '보호자',
    screen: paths.console.addresses,
    call: {
      method: 'GET',
      pattern: /^\/members\/me\/addresses$/,
      expect: (log) =>
        Array.isArray(log.responseBody) &&
        (log.responseBody as Body[]).filter((item) => item.isDefault).length === 1,
    },
  },
  {
    id: 'seller-apply',
    step: '②',
    title: '판매자 신청',
    expected: 'POST /members/me/seller-application 2xx',
    role: '보호자',
    screen: paths.console.sellerApply,
    call: { method: 'POST', pattern: /^\/members\/me\/seller-application$/ },
  },
  {
    id: 'seller-approve',
    step: '②',
    title: '관리자 승인',
    expected: '응답 status = APPROVED',
    role: '관리자',
    screen: paths.console.adminSellerApplications,
    call: {
      method: 'POST',
      pattern: /^\/admin\/seller-applications\/[^/]+\/approve$/,
      expect: (log) => body(log).status === 'APPROVED',
    },
  },
  {
    id: 'product-register',
    step: '②',
    title: '상품 등록',
    expected: 'POST /seller/products 2xx',
    role: '판매자',
    screen: paths.console.sellerProducts,
    call: { method: 'POST', pattern: /^\/seller\/products$/ },
  },
  {
    id: 'product-start',
    step: '②',
    title: '판매 시작',
    expected: 'POST .../start-sale 2xx',
    role: '판매자',
    screen: paths.console.sellerProducts,
    call: { method: 'POST', pattern: /^\/seller\/products\/[^/]+\/start-sale$/ },
  },
  {
    id: 'size-recommend',
    step: '③',
    title: '사이즈 추천',
    expected: '추천 사이즈가 있음',
    role: '보호자',
    screen: paths.console.products,
    call: {
      method: 'GET',
      pattern: /^\/products\/[^/]+\/size-recommendation/,
      expect: (log) => typeof body(log).recommendedSize === 'string',
    },
  },
  {
    id: 'recommended-list',
    step: '③',
    title: '자녀 맞춤 목록',
    expected: '맞는 상품 1개 이상',
    role: '보호자',
    screen: paths.console.products,
    call: {
      method: 'GET',
      pattern: /^\/children\/[^/]+\/recommended-products/,
      expect: (log) => ((body(log).content as unknown[]) ?? []).length > 0,
    },
  },
  {
    id: 'charge',
    step: '④',
    title: '예치금 충전 승인',
    expected: '응답 status = DONE',
    role: '보호자',
    screen: paths.console.wallet,
    call: {
      method: 'POST',
      pattern: /^\/wallets\/me\/charges\/confirm$/,
      expect: (log) => body(log).status === 'DONE',
    },
  },
  {
    id: 'cart',
    step: '④',
    title: '장바구니 담기',
    expected: 'POST /cart/items 2xx',
    role: '보호자',
    screen: paths.console.products,
    call: { method: 'POST', pattern: /^\/cart\/items$/ },
  },
  {
    id: 'order',
    step: '④',
    title: '주문하기',
    expected: '201 + status = PENDING_PAYMENT',
    role: '보호자',
    screen: paths.console.cart,
    call: {
      method: 'POST',
      pattern: /^\/orders$/,
      expect: (log) => log.status === 201 && body(log).status === 'PENDING_PAYMENT',
    },
  },
  {
    id: 'order-paid',
    step: '④',
    title: '결제 완료 (서버 이벤트)',
    expected: '주문 상세 status = PAID',
    role: '보호자',
    screen: paths.console.orders,
    logs: orderPaid,
  },
  {
    id: 'payment-record',
    step: '④',
    title: '결제 도메인 결제 기록',
    expected: 'GET /payments에 결제 완료 주문과 같은 금액의 COMPLETED 결제',
    role: '보호자',
    screen: paths.console.orders,
    logs: paymentRecorded,
  },
  {
    id: 'buyer-balance',
    step: '④',
    title: '보호자 잔액 감소',
    expected: '회원 1 잔액 조회 값이 줄어듦',
    role: '보호자',
    screen: paths.console.wallet,
    logs: balanceChange('1', 'down'),
  },
  {
    id: 'ship',
    step: '⑤',
    title: '발송 (송장 등록)',
    expected: '응답 status = SHIPPING',
    role: '판매자',
    screen: paths.console.sellerOrders,
    call: {
      method: 'POST',
      pattern: /^\/seller\/orders\/[^/]+\/ship$/,
      expect: (log) => body(log).status === 'SHIPPING',
    },
  },
  {
    id: 'deliver',
    step: '⑤',
    title: '배송 완료',
    expected: '응답 status = DELIVERED',
    role: '판매자',
    screen: paths.console.sellerOrders,
    call: {
      method: 'POST',
      pattern: /^\/seller\/orders\/[^/]+\/deliver$/,
      expect: (log) => body(log).status === 'DELIVERED',
    },
  },
  {
    id: 'confirm',
    step: '⑥',
    title: '구매확정',
    expected: '응답 status = CONFIRMED',
    role: '보호자',
    screen: paths.console.orders,
    call: {
      method: 'POST',
      pattern: /^\/orders\/[^/]+\/items\/[^/]+\/confirm$/,
      expect: (log) => body(log).status === 'CONFIRMED',
    },
  },
  {
    id: 'settle',
    step: '⑦',
    title: '정산 실행',
    expected: '정산서 1개 이상 생성',
    role: '관리자',
    screen: paths.console.adminSettlements,
    call: {
      method: 'POST',
      pattern: /^\/admin\/settlements\/run$/,
      expect: (log) => Number(body(log).settlementCount) >= 1,
    },
  },
  {
    id: 'seller-balance',
    step: '⑦',
    title: '판매자 지갑 적립',
    expected: '회원 2 잔액 조회 값이 늘어남 (정산 목이면 늘지 않음)',
    role: '판매자',
    screen: paths.console.sellerSettlements,
    logs: balanceChange('2', 'up'),
  },
]
