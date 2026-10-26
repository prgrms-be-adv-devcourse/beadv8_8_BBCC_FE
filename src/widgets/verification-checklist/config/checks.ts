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

/** 회원마다 마지막 결제 목록(GET /payments). 역할 전환 뒤 다른 회원이 조회한 목록과 섞이지 않게 */
function latestPaymentsByActor(logs: ApiCallLog[]): Map<string | null, Body[]> {
  const latest = new Map<string | null, Body[]>()
  for (const log of logs) {
    if (log.method === 'GET' && log.path.split('?')[0] === '/payments' && ok2xx(log)) {
      latest.set(log.actor, (body(log).content as Body[] | undefined) ?? [])
    }
  }
  return latest
}

/** 결제 완료(PAID)로 본 주문이 결제 도메인 목록(GET /payments)에 같은 금액의 COMPLETED로 있는지 */
const paymentRecorded: LogsCheck = (logs) => {
  // 주문 ID → 금액 · 조회한 회원 (결제 목록은 그 회원의 것으로 비교한다)
  const paidOrders = new Map<string, { total: number; actor: string | null }>()
  for (const log of logs) {
    const order = body(log)
    if (
      log.method === 'GET' &&
      /^\/orders\/[^/]+$/.test(log.path) &&
      ok2xx(log) &&
      order.status === 'PAID'
    ) {
      // 처음 결제 완료를 본 회원 = 주문한 회원 (역할 전환 뒤 다른 회원이 다시 조회해도 바꾸지 않음)
      if (!paidOrders.has(String(order.orderId))) {
        paidOrders.set(String(order.orderId), {
          total: Number(order.totalAmount),
          actor: log.actor,
        })
      }
    }
  }
  const latestPayments = latestPaymentsByActor(logs)
  const won = (value: number) => `${value.toLocaleString('ko-KR')}원`
  const problems: string[] = []
  for (const [orderId, { total, actor }] of paidOrders) {
    const list = latestPayments.get(actor)
    if (!list) continue
    const payment = list
      .map((item) => ({
        id: String(item.paymentId),
        orderId: String(item.orderId),
        amount: Number(item.amount),
        status: String(item.status),
      }))
      .find((item) => item.orderId === orderId)
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
  if (problems.length === 0) return null
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
    screen: paths.console.childNew,
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
    screen: paths.console.sellerProductNew,
    call: { method: 'POST', pattern: /^\/seller\/products$/ },
  },
  {
    id: 'product-start',
    step: '②',
    title: '판매 시작',
    expected: 'PUT .../sale-status → ON_SALE',
    role: '판매자',
    screen: paths.console.sellerProducts,
    call: {
      method: 'PUT',
      pattern: /^\/seller\/products\/[^/]+\/sale-status$/,
      expect: (log) => body(log).status === 'ON_SALE',
    },
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
    expected:
      '실행 기록 status = COMPLETED · 성공 1건 이상 (기준일 오늘 → 어제까지 구매확정분이 있을 때)',
    role: '관리자',
    screen: paths.console.adminSettlements,
    call: {
      method: 'POST',
      pattern: /^\/admin\/settlements\/run$/,
      expect: (log) => body(log).status === 'COMPLETED' && Number(body(log).successCount) >= 1,
    },
  },
  {
    id: 'seller-balance',
    step: '⑦',
    title: '판매자 예치금 입금',
    expected: '회원 2 잔액 조회 값이 늘어남 (정산 → settlement.payout-requested → 결제가 입금)',
    role: '판매자',
    screen: paths.console.sellerSettlements,
    logs: balanceChange('2', 'up'),
  },
]

// ── 기획서 2.1 취소 · 실패 시나리오 (정상 흐름 다음). 정상 흐름 판정과 따로 센다 ──

const orderDetailLogs = (logs: ApiCallLog[]) =>
  logs.filter(
    (log) => log.method === 'GET' && /^\/orders\/[^/]+$/.test(log.path.split('?')[0]) && ok2xx(log),
  )

/** 이 이유로 취소된 주문 상세가 보이면 통과. 안 보이면 대기 (재현하지 않은 시나리오) */
function cancelledWith(reason: string): LogsCheck {
  return (logs) => {
    const hit = orderDetailLogs(logs).findLast(
      (log) => body(log).status === 'CANCELLED' && body(log).cancelReason === reason,
    )
    return hit
      ? {
          pass: true,
          evidence: `${hit.startedAt.slice(11, 19)} GET ${hit.path} → CANCELLED (${reason})`,
        }
      : null
  }
}

/** 잔액 부족으로 취소된 주문 ↔ 결제 도메인 FAILED(INSUFFICIENT_BALANCE) 기록 */
const paymentFailedRecorded: LogsCheck = (logs) => {
  // 주문 ID → 조회한 회원 (결제 목록은 그 회원의 것으로 비교한다)
  const failedOrders = new Map(
    orderDetailLogs(logs)
      .filter(
        (log) => body(log).status === 'CANCELLED' && body(log).cancelReason === 'PAYMENT_FAILED',
      )
      .map((log) => [String(body(log).orderId), log.actor] as const)
      // 처음 본 회원 = 주문한 회원
      .reverse(),
  )
  const latestPayments = latestPaymentsByActor(logs)
  const checked = [...failedOrders].filter(([, actor]) => latestPayments.has(actor))
  if (checked.length === 0) return null
  for (const [orderId, actor] of checked) {
    const payment = latestPayments.get(actor)!.find((item) => String(item.orderId) === orderId)
    if (payment?.status === 'FAILED' && payment.failureCode === 'INSUFFICIENT_BALANCE') {
      return {
        pass: true,
        evidence: `주문 #${orderId} ↔ 결제 #${String(payment.paymentId)} FAILED (INSUFFICIENT_BALANCE)`,
      }
    }
  }
  return {
    pass: false,
    evidence: `잔액 부족 취소 주문 #${checked.map(([orderId]) => orderId).join(', #')}의 실패 결제 기록이 결제 목록에 없음`,
  }
}

export const FAILURE_CHECKS: VerificationCheck[] = [
  {
    id: 'cancel-payment-failed',
    step: '취소',
    title: '잔액 부족 → 주문 취소',
    expected: '주문 상세 CANCELLED (PAYMENT_FAILED), 예치금은 빠지지 않음',
    role: '보호자',
    screen: paths.console.cart,
    logs: cancelledWith('PAYMENT_FAILED'),
  },
  {
    id: 'payment-failed-record',
    step: '취소',
    title: '결제 도메인 실패 기록',
    expected: 'GET /payments에 그 주문의 FAILED (INSUFFICIENT_BALANCE)',
    role: '보호자',
    screen: paths.console.orders,
    logs: paymentFailedRecorded,
  },
  {
    id: 'cancel-out-of-stock',
    step: '취소',
    title: '재고 부족 → 주문 취소 · 재고 복구',
    expected: '주문 상세 CANCELLED (OUT_OF_STOCK)',
    role: '보호자',
    screen: paths.console.cart,
    logs: cancelledWith('OUT_OF_STOCK'),
  },
  {
    id: 'cancel-expired',
    step: '취소',
    title: '결제 제한 시간 초과 → 주문 취소',
    expected: '주문 상세 CANCELLED (PAYMENT_EXPIRED), 10분 (설정값)',
    role: '보호자',
    screen: paths.console.orders,
    logs: cancelledWith('PAYMENT_EXPIRED'),
  },
]
