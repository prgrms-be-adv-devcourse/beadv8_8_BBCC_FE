// E2E 전용 가짜 백엔드 (실제 백엔드 코드와 무관). 구현된 API의 응답 모양(DTO)만 흉내 낸다.
// 상품은 등록 · 판매 시작 · 상세 · 카테고리 · 이미지 업로드 주소 발급만 있다(products.mjs). 판매자 상품 목록 · 상세 · 재고 조정 · 판매 중지도 products.mjs. 상품 목록 · 사이즈 추천 · 자녀 맞춤 목록 · 관리자 전체 주문 · 결제 · 정산은 여기서 응답하고, 상품 수정은 FE 목(app/mocks)이 응답한다.
// 응답 모양이 실제와 달라지면 FE 흐름 패널의 계약 검사로 드러난다.
import http from 'node:http'
import {
  categoryInputs,
  categoryTreeFor,
  listOf as productListOf,
  adjustInventory,
  adminChangeSaleStatus,
  adminRevertDelist,
  changeSaleStatus,
  delist,
  detailOf as productDetailOf,
  issueImageUploadUrls,
  register,
  replica,
  sellerDetailOf,
  sellerListOf,
  stock,
  updateProduct,
} from './products.mjs'
import { catalogRoute } from './catalog.mjs'
import {
  garmentPartOfCategory,
  itemJudgementsOf,
  referenceFitOf,
  referenceGarmentRoute,
} from './reference-garments.mjs'
import { memberFavoriteRoute, publicFavoriteRoute } from './favorites.mjs'
import { adminReviewRoute, memberReviewRoute, publicReviewRoute } from './reviews.mjs'
import { notificationRoute } from './notifications.mjs'

const PORT = Number(process.env.PORT ?? 18080)
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
let id = 1
const nid = () => id++
const childAccounts = []
const wishRequests = []
const children = [],
  addresses = [],
  cart = [],
  orders = [],
  apps = [],
  payments = [],
  charges = [],
  // 정산 (BE SellerSettlementController · AdminSettlementController)
  settlements = [],
  settlementRuns = []
const verifications = {
  1: '2026-01-01T00:00:00',
  2: '2026-01-01T00:00:00',
  3: '2026-01-01T00:00:00',
}
const wallets = { 1: 100000, 2: 0, 3: 0 }
// 주문 멱등키 (BE #351): '회원:키' → { hash, orderId }
const idempotency = {}
// BE WalletLedger: 잔액이 바뀔 때마다 한 줄 (출금은 음수)
// 관리자 처리 대기 기록 (가짜는 하나씩으로 시작)
const opsRecoveries = [
  {
    recoveryId: '9001',
    orderId: '9001',
    paymentId: '9001',
    memberId: '1',
    amount: 25000,
    items: [{ orderItemId: '9001', amount: 25000 }],
    status: 'PENDING',
    failureCode: 'ORDER_STATE_CONFLICT',
    attemptCount: 1,
    lastAttemptedAt: null,
    createdAt: '2026-11-12T09:00:00',
  },
]
const opsEventFailures = [
  {
    failureId: '9101',
    eventType: 'stock.deducted',
    orderId: '9101',
    stockFailures: [],
    status: 'PENDING',
    failureCode: 'OptimisticLockException',
    attemptCount: 1,
    lastAttemptedAt: null,
    createdAt: '2026-11-12T09:00:00',
  },
]
const opsOutbox = [
  {
    outboxId: '9201',
    eventId: '00000000-0000-4000-8000-000000009201',
    eventType: 'order.paid',
    topic: 'kidly.order.events',
    messageKey: '9201',
    status: 'QUARANTINED',
    attemptCount: 10,
    lastError: 'TimeoutException',
    createdAt: '2026-11-12T09:00:00',
    quarantinedAt: '2026-11-12T09:30:00',
    sentAt: null,
    lastRetriedAt: null,
    lastRetriedBy: null,
    retryCount: 0,
  },
]
const ledgers = []
const ledger = (memberId, type, amount, refId) =>
  ledgers.push({
    ledgerId: ledgers.length + 1,
    memberId,
    type,
    amount,
    balanceAfter: wallets[memberId] ?? 0,
    refId,
    createdAt: now(),
  })
// 관리자 회원 목록용 (기획서 7.1: 회원 1 보호자 · 2 판매자 · 3). 관리자는 회원이 아니라 관리자 계정이다 (BE #762)
const members = {
  1: {
    nickname: '보호자',
    status: 'ACTIVE',
    sellerStatus: null,
    suspendReason: null,
    suspendedAt: null,
  },
  2: {
    nickname: '테스트상점',
    status: 'ACTIVE',
    sellerStatus: 'ACTIVE',
    suspendReason: null,
    suspendedAt: null,
  },
  3: {
    nickname: '관리자',
    status: 'ACTIVE',
    sellerStatus: null,
    suspendReason: null,
    suspendedAt: null,
  },
}
const now = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 19)
// BE kidly.order.wish.expiry.ttl 기본 7일: 대기 중인 조르기의 expiresAt = 보낸 시각 + 7일
const WISH_TTL_MS = 7 * 24 * 3600e3
const wishExpiresAt = (requestedAt) =>
  new Date(new Date(`${requestedAt}Z`).getTime() + WISH_TTL_MS).toISOString().slice(0, 19)
const later = (ms) => new Date(Date.now() + 9 * 3600e3 + ms).toISOString().slice(0, 19)
// 결제 마감 (BE kidly.order.payment-timeout, 기본 10분)
const PAYMENT_TIMEOUT_MS = 10 * 60e3
// 다음 주문 하나를 처리하지 않고 결제 마감에 취소한다 (상품 order.created 리스너가 없는 실제 백엔드 흉내).
// POST /__fake/payment-stall { timeoutMs } — 가짜 백엔드 전용
let stallNext = null
const SORTS = ['NEWEST', 'PRICE_ASC', 'PRICE_DESC', 'RELEVANCE']
/** POST /search/clicks 본문 검사 (BE @Valid). 틀리면 detail, 맞으면 null */
function searchClickProblem(body) {
  const keyword = typeof body?.keyword === 'string' ? body.keyword.trim() : ''
  if (!keyword) return '검색어를 입력해 주세요.'
  if (body.keyword.length > 50) return '검색어는 50자 이하여야 합니다.'
  if (!Number.isInteger(body.productId) || body.productId <= 0) return '상품 ID는 양수여야 합니다.'
  if (!Number.isInteger(body.rank) || body.rank < 1 || body.rank > 10000)
    return '순위는 1 이상 10000 이하여야 합니다.'
  if (body.sort != null && !SORTS.includes(body.sort))
    return '정렬은 NEWEST, PRICE_ASC, PRICE_DESC, RELEVANCE 중 하나여야 합니다.'
  if (body.childId != null && (!Number.isInteger(body.childId) || body.childId <= 0))
    return '자녀 ID는 양수여야 합니다.'
  return null
}
const problem = (res, status, title, detail, instance) =>
  send(res, status, { type: 'about:blank', title, status, detail, instance })
// BE WishErrorCode와 같은 상태 · title · detail (#999)
const WISH_ERROR = {
  WISH_ITEM_IN_REQUEST: [
    409,
    '조르는 중인 상품입니다',
    '진행 중인 조르기에 든 장바구니 상품은 다른 조르기에 넣을 수 없습니다.',
  ],
  INVALID_WISH_REQUEST: [
    400,
    '잘못된 조르기입니다',
    '조를 장바구니 상품을 하나 이상 겹치지 않게 고르고, 메시지는 정해진 길이 안으로 적어 주세요.',
  ],
  WISH_REQUEST_NOT_FOUND: [
    404,
    '조르기를 찾을 수 없습니다',
    '없는 조르기입니다. 목록을 새로고침해 주세요.',
  ],
  WISH_REQUEST_ALREADY_DECIDED: [
    409,
    '이미 처리한 조르기입니다',
    '이미 처리(결제 · 거절 · 철회 · 만료)한 조르기입니다. 목록을 새로고침해 주세요.',
  ],
  WISH_REQUEST_SEND_FORBIDDEN: [
    403,
    '조르기를 보낼 수 없습니다',
    '조르기는 자녀 계정으로만 보낼 수 있습니다.',
  ],
  WISH_REQUEST_CANCEL_FORBIDDEN: [
    403,
    '조르기를 철회할 수 없습니다',
    '조르기는 보낸 사람만 철회할 수 있습니다.',
  ],
  WISH_REQUEST_EXPIRED: [
    409,
    '기한이 지난 조르기입니다',
    '응답 기한이 지나 만료된 조르기입니다. 필요하면 다시 조르기를 보내 주세요.',
  ],
  WISH_REQUEST_DECIDE_FORBIDDEN: [
    403,
    '조르기를 거절할 수 없습니다',
    '조르기는 승인자(보호자)만 거절할 수 있습니다.',
  ],
  INVALID_REJECT_REASON: [400, '잘못된 거절 사유입니다', '거절 사유를 목록에서 골라 주세요.'],
}
// BE CartErrorCode와 같은 상태 · title · detail (#998)
const CART_ERROR = {
  INVALID_QUANTITY: [400, '잘못된 수량입니다', '수량은 1 이상 99 이하여야 합니다.'],
  PRODUCT_OPTION_NOT_FOUND: [
    404,
    '상품 옵션을 찾을 수 없습니다',
    '없는 상품 옵션입니다. 상품 화면에서 옵션을 다시 골라 주세요.',
  ],
  CART_ITEM_NOT_FOUND: [
    404,
    '장바구니 상품을 찾을 수 없습니다',
    '이미 장바구니에서 빠진 상품입니다. 장바구니를 새로고침해 주세요.',
  ],
  CART_FORBIDDEN: [403, '다른 사람의 장바구니입니다', '자기 장바구니만 보고 바꿀 수 있습니다.'],
  CHILD_ACCOUNT_FORBIDDEN: [
    403,
    '장바구니를 쓸 수 없는 자녀 계정입니다',
    '자녀 계정 연결을 확인할 수 없습니다. 다시 로그인해 주세요.',
  ],
  CHILD_CART_CHILD_FIXED: [
    400,
    '다른 자녀를 고를 수 없습니다',
    '자녀 장바구니에는 그 자녀가 입을 상품만 담을 수 있습니다.',
  ],
  CART_ITEM_RESERVED: [
    409,
    '예약된 장바구니 상품입니다',
    '다른 곳에서 결제를 기다리는 상품이라 빼거나 수량을 바꿀 수 없습니다.',
  ],
  CART_ITEM_NOT_ORDERABLE: [
    403,
    '주문할 수 없는 장바구니 상품입니다',
    '자기 장바구니 상품이나 결제를 허락받은 상품만 주문할 수 있습니다.',
  ],
  RESERVED_QUANTITY_EXCEEDED: [
    409,
    '예약된 수량보다 많이 주문할 수 없습니다',
    '결제를 허락받은 장바구니 상품은 담긴 수량까지만 주문할 수 있습니다.',
  ],
}
const cartProblem = (res, code, instance) => problem(res, ...CART_ERROR[code], instance)
/** 대기 중인 조르기에 든 칸 = 예약된 칸 (BE CartReservations) */
const wishOfLine = (l) =>
  wishRequests.find(
    (w) => w.status === 'REQUESTED' && w.items.some((item) => item.cartItemId === l.cartItemId),
  )
const isReserved = (l) => !!wishOfLine(l)
const wishProblem = (res, code, instance) => problem(res, ...WISH_ERROR[code], instance)
const WISH_REJECT_REASONS = ['TOO_EXPENSIVE', 'ALREADY_HAVE', 'NEXT_TIME', 'OTHER']
// 주문이 취소된 시각 (주문 상세 응답에는 없는 값이라 따로 둔다)
const cancelledAt = new WeakMap()
// 주문상품을 산 장바구니 칸 (요청의 cartItemId, 응답에는 없는 값이라 따로 둔다)
const orderCartLines = new WeakMap()
// BE OrderTimeline.from 줄임판 (판매자 한 명): 조르기로 바로 결제한 주문의 단계
function orderStepsOf(o) {
  const step = (name, at, otherwise = 'WAITING') => ({
    step: name,
    status: at ? 'DONE' : otherwise,
    at: at ?? null,
  })
  const payment = payments.find((p) => p.orderId === o.orderId)
  const paidAt = payment?.paidAt
  if (o.status === 'CANCELLED')
    return [
      step('CREATED', o.orderedAt),
      step('PAYMENT_REQUESTED', payment?.createdAt, 'NOT_APPLICABLE'),
      ...(paidAt ? [step('PAID', paidAt)] : []),
      step('CANCELLED', cancelledAt.get(o)),
      ...['SHIPPED', 'DELIVERED', 'CONFIRMED'].map((name) => step(name, null, 'NOT_APPLICABLE')),
    ]
  const confirmed = o.items.map((item) => item.confirmedAt).filter(Boolean)
  const allConfirmed = confirmed.length === o.items.length
  return [
    step('CREATED', o.orderedAt),
    step('PAYMENT_REQUESTED', payment?.createdAt),
    step('PAID', paidAt),
    step('SHIPPED', o.deliveries[0]?.shippedAt),
    step('DELIVERED', o.deliveries[0]?.deliveredAt),
    step(
      'CONFIRMED',
      allConfirmed ? confirmed.sort().at(-1) : null,
      confirmed.length ? 'PARTIAL' : 'WAITING',
    ),
  ]
}
// BE OrderTimeline.from (#352): 저장된 시각으로 단계를 조립. 취소는 마지막 완료 단계 뒤 CANCELLED(근사 시각) + 나머지 해당 없음
function orderTimelineOf(o) {
  const payment = payments.find((p) => p.orderId === o.orderId)
  const paidAt = payment?.status === 'COMPLETED' ? payment.paidAt : null
  const cancelled = o.status === 'CANCELLED'
  const sellerName = (sellerId) =>
    o.items.find((it) => it.sellerId === sellerId)?.sellerName ?? null
  const simple = (step, status, at = null, approximate = false, details = []) => ({
    step,
    status,
    at,
    approximate,
    details,
  })
  const progress = (doneAts, expected) => {
    const done = doneAts.filter(Boolean)
    if (done.length > 0 && done.length === doneAts.length && doneAts.length >= expected)
      return { status: 'DONE', at: done.sort().at(-1) }
    return { status: done.length ? 'PARTIAL' : 'WAITING', at: null }
  }
  const deliveryDetail = (d, at, status = at ? 'DONE' : 'WAITING') => ({
    sellerOrderId: d.sellerOrderId,
    sellerId: d.sellerId,
    sellerName: sellerName(d.sellerId),
    status,
    at,
  })
  const itemDetail = (it, status, at) => ({
    orderItemId: it.orderItemId,
    productName: it.productName,
    status,
    at,
    confirmType: status === 'DONE' ? it.confirmType : null,
  })
  const steps = [simple('CREATED', 'DONE', o.orderedAt)]
  steps.push(
    payment
      ? simple('PAYMENT_REQUESTED', 'DONE', payment.createdAt)
      : simple('PAYMENT_REQUESTED', cancelled ? 'NOT_APPLICABLE' : 'WAITING'),
  )
  if (paidAt) steps.push(simple('PAID', 'DONE', paidAt))
  else if (!cancelled) steps.push(simple('PAID', 'WAITING'))
  if (cancelled) {
    const notShipped = paidAt
      ? o.deliveries.map((d) => deliveryDetail(d, null, 'NOT_APPLICABLE'))
      : []
    const notConfirmed = paidAt ? o.items.map((it) => itemDetail(it, 'NOT_APPLICABLE', null)) : []
    steps.push(
      simple('CANCELLED', 'DONE', cancelledAt.get(o) ?? o.orderedAt, true),
      simple('SHIPPED', 'NOT_APPLICABLE', null, false, notShipped),
      simple('DELIVERED', 'NOT_APPLICABLE', null, false, notShipped),
      simple('CONFIRMED', 'NOT_APPLICABLE', null, false, notConfirmed),
    )
  } else {
    const sellerCount = new Set(
      o.items.filter((it) => it.status !== 'CANCELLED').map((it) => it.sellerId),
    ).size
    for (const [name, key] of [
      ['SHIPPED', 'shippedAt'],
      ['DELIVERED', 'deliveredAt'],
    ]) {
      const details = o.deliveries.map((d) =>
        d.status === 'CANCELLED'
          ? deliveryDetail(d, null, 'NOT_APPLICABLE')
          : deliveryDetail(d, d[key] ?? null),
      )
      const p = progress(
        details.filter((each) => each.status !== 'NOT_APPLICABLE').map((each) => each.at),
        sellerCount,
      )
      steps.push(simple(name, p.status, p.at, false, details))
    }
    const items = o.items.map((it) =>
      it.status === 'CANCELLED'
        ? itemDetail(it, 'NOT_APPLICABLE', null)
        : itemDetail(it, it.confirmedAt ? 'DONE' : 'WAITING', it.confirmedAt ?? null),
    )
    const live = items.filter((each) => each.status !== 'NOT_APPLICABLE').map((each) => each.at)
    const p = progress(live, live.length)
    steps.push(simple('CONFIRMED', p.status, p.at, false, items))
  }
  const current = steps.filter((each) => each.status === 'DONE' || each.status === 'PARTIAL').at(-1)
  return {
    orderId: String(o.orderId),
    status: o.status,
    currentStep: current.step,
    cancelReason: o.cancelReason,
    paymentDueAt: o.status === 'PENDING_PAYMENT' ? o.paymentDueAt : null,
    steps,
  }
}
// 주문 BE #253: 수량 1~99, 범위 밖이면 400 INVALID_QUANTITY
const badQuantity = (q) => !Number.isInteger(q) || q < 1 || q > 99
const invalidQuantity = (res) =>
  problem(
    res,
    400,
    '수량이 올바르지 않습니다',
    '수량은 1개부터 99개까지 담을 수 있습니다.',
    '/cart/items',
  )

/** 찜 · 리뷰 화면에 보이는 상품 표시 상태 (BE community DisplayStatus): 판매 중이 아니거나 옵션이 없으면 판매 종료, 모두 재고 없으면 품절 */
function favoriteProductView(productId) {
  const detail = productDetailOf(productId)
  if (!detail) return null
  const displayStatus =
    detail.status !== 'ON_SALE' || detail.options.length === 0
      ? 'SALE_ENDED'
      : detail.options.some((option) => option.purchasable)
        ? 'ON_SALE'
        : 'SOLD_OUT'
  return { name: detail.name, thumbnailUrl: detail.thumbnailUrl, displayStatus }
}

/** reviews.mjs · notifications.mjs · favorites.mjs 결과 { status, body } · { status, title, detail }를 응답으로 */
const reviewResult = (res, result, instance) =>
  result.title
    ? problem(res, result.status, result.title, result.detail, instance)
    : send(res, result.status, result.body)
function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'content-type': status >= 400 ? 'application/problem+json' : 'application/json',
    ...headers,
  })
  res.end(body === undefined ? '' : JSON.stringify(body))
}
// 함께 사면 · 홈 맛보기 SSE (BE 계약, FE #290). Accept: text/event-stream이면 흘려보낸다
// AI 답이고 처음 묻는 요청이면 rule(같은 상품, 이유 없음) → 잠시 뒤 ai, 다시 물으면 저장해 둔 답처럼 ai만, 규칙 답이면 rule만
const answeredStreams = new Set()
const STREAM_AI_WAIT_MS = 300
function sendPicks(req, res, picks) {
  if (!String(req.headers.accept ?? '').includes('text/event-stream')) return send(res, 200, picks)
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    'x-accel-buffering': 'no',
  })
  const write = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  if (picks.source === 'RULE') {
    write('rule', picks)
    return res.end()
  }
  if (answeredStreams.has(req.url)) {
    write('ai', picks)
    return res.end()
  }
  answeredStreams.add(req.url)
  write('rule', {
    source: 'RULE',
    products: picks.products.map((product) => ({ ...product, reason: null })),
  })
  setTimeout(() => {
    write('ai', picks)
    res.end()
  }, STREAM_AI_WAIT_MS)
}
const page = (content) => ({
  content,
  page: 0,
  size: 20,
  totalElements: content.length,
  totalPages: 1,
  hasNext: false,
})
/** 요청의 page · size(기본 0 · 20)로 자른 PageResponse (BE PageResponse) */
const pageFrom = (content, query) => {
  const number = Math.max(0, Number(query.get('page') ?? 0))
  const size = Number(query.get('size') ?? 20)
  return {
    content: content.slice(number * size, (number + 1) * size),
    page: number,
    size,
    totalElements: content.length,
    totalPages: Math.ceil(content.length / size),
    hasNext: (number + 1) * size < content.length,
  }
}
// 관리자 토큰 클레임은 sub("admin:7") · iat · exp뿐 (BE #736)
const ADMIN = {
  email: 'admin@kidly.local',
  password: 'local-admin-password',
  token: `${b64({ alg: 'none' })}.${b64({ sub: 'admin:1' })}.sig`,
  refresh: 'fake-admin-refresh',
}
const adminCookie = (value, maxAge = 1209600) =>
  `admin_refresh_token=${value}; Path=/api/v1/auth/admin; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`
const isAdmin = (u) => String(u.sub).startsWith('admin:')
function who(req) {
  const t = (req.headers.authorization || '').split(' ')[1]
  if (!t) return null
  return JSON.parse(Buffer.from(t.split('.')[1], 'base64url'))
}
// BE OrderStatusHistory (#442): 주문 · 주문상품 · 배송 상태가 바뀔 때마다 한 줄 (관리자 상태 이력)
function recordHistory(
  o,
  targetType,
  targetId,
  fromStatus,
  toStatus,
  reason,
  actorType,
  actorId,
  source,
) {
  ;(o.history ??= []).push({
    historyId: String(nid()),
    targetType,
    targetId: String(targetId),
    fromStatus,
    toStatus,
    reason,
    actorType,
    actorId: actorId == null ? null : String(actorId),
    source,
    occurredAt: now(),
  })
}
const cancelOrderHistory = (o, reason, actorType, actorId, source) =>
  recordHistory(
    o,
    'ORDER',
    o.orderId,
    'PENDING_PAYMENT',
    'CANCELLED',
    reason,
    actorType,
    actorId,
    source,
  )
function scheduleOrder(o, me, stall, clearCart = true) {
  // 결제 마감: 그때까지 결제 처리 중이면 PAYMENT_EXPIRED로 취소 (BE 마감 스케줄러)
  setTimeout(() => {
    if (o.status !== 'PENDING_PAYMENT') return
    o.status = 'CANCELLED'
    o.cancelReason = 'PAYMENT_EXPIRED'
    cancelledAt.set(o, now())
    cancelOrderHistory(o, 'PAYMENT_EXPIRED', 'SYSTEM', null, 'scheduler:payment-expiry')
  }, stall?.timeoutMs ?? PAYMENT_TIMEOUT_MS).unref()
  if (!stall)
    setTimeout(() => {
      // 구매자가 결제 전에 취소했으면 재고 · 결제를 처리하지 않는다
      if (o.status !== 'PENDING_PAYMENT') return
      // 상품: 하나라도 부족하면 아무것도 차감하지 않고 주문 취소 (기획서 4장).
      // 장바구니는 그대로 남는다 (BE: 결제 완료 뒤 주문한 줄만 빠진다)
      const short = o.items.filter((it) => (stock[it.optionId] ?? 0) < it.quantity)
      if (short.length > 0) {
        o.status = 'CANCELLED'
        o.cancelReason = 'OUT_OF_STOCK'
        cancelledAt.set(o, now())
        cancelOrderHistory(o, 'OUT_OF_STOCK', 'EVENT', null, 'stock.deduction-failed')
        short.forEach((it) => (it.unavailableReason = 'OUT_OF_STOCK'))
        return
      }
      o.items.forEach((it) => (stock[it.optionId] -= it.quantity))
      if ((wallets[me] ?? 0) < o.totalAmount) {
        // 결제 실패 → 주문 취소 · 재고 복구
        o.items.forEach((it) => (stock[it.optionId] += it.quantity))
        o.status = 'CANCELLED'
        o.cancelReason = 'PAYMENT_FAILED'
        cancelledAt.set(o, now())
        cancelOrderHistory(o, 'PAYMENT_FAILED', 'EVENT', null, 'payment.failed')
        // 백엔드: 잔액 부족만 실패 결제를 저장한다
        payments.push({
          paymentId: nid(),
          memberId: me,
          orderId: o.orderId,
          amount: o.totalAmount,
          refundedAmount: 0,
          status: 'FAILED',
          failureCode: 'INSUFFICIENT_BALANCE',
          paidAt: null,
          createdAt: now(),
          items: [],
        })
        return
      }
      wallets[me] -= o.totalAmount
      const paymentId = nid()
      ledger(me, 'PAYMENT', -o.totalAmount, paymentId)
      payments.push({
        paymentId,
        memberId: me,
        orderId: o.orderId,
        amount: o.totalAmount,
        refundedAmount: 0,
        status: 'COMPLETED',
        failureCode: null,
        paidAt: now(),
        createdAt: now(),
        items: o.items.map((i) => ({
          orderItemId: Number(i.orderItemId),
          amount: i.amount,
          refundedAmount: 0,
        })),
      })
      o.status = 'PAID'
      recordHistory(
        o,
        'ORDER',
        o.orderId,
        'PENDING_PAYMENT',
        'PAID',
        null,
        'EVENT',
        null,
        'payment.completed',
      )
      // 칸으로 산 줄(BE #998): 산 수량만큼 칸에서 빼고, 조르기 예약 칸이면 조르기를 결제 완료로 (BE WishPurchaseService)
      const cartLines = orderCartLines.get(o) ?? []
      for (const bought of cartLines) {
        const index = cart.findIndex((l) => l.cartItemId === bought.cartItemId)
        if (index < 0) continue
        const wish = wishOfLine(cart[index])
        cart[index].quantity -= bought.quantity
        if (cart[index].quantity <= 0) cart.splice(index, 1)
        if (!wish) continue
        if (wish.status === 'REQUESTED') {
          wish.status = 'PAID'
          wish.expiresAt = null
          wish.payerType = 'MEMBER'
          wish.payerId = String(me)
          wish.paidAt = now()
        }
        wish.purchases.push({
          orderId: String(o.orderId),
          cartItemId: bought.cartItemId,
          quantity: bought.quantity,
          purchasedAt: now(),
        })
        wish.paidOrderItemIds.push(bought.orderItemId)
        const line = wish.items.find((item) => item.cartItemId === bought.cartItemId)
        if (line) line.purchased = !cart.some((l) => l.cartItemId === bought.cartItemId)
      }
      // 결제 완료 → 칸 없이 주문한 옵션의 내 장바구니 줄만 뺀다
      const viaCart = new Set(cartLines.map((bought) => bought.orderItemId))
      const ordered = new Set(
        o.items.filter((it) => !viaCart.has(it.orderItemId)).map((it) => String(it.optionId)),
      )
      if (clearCart)
        for (let i = cart.length - 1; i >= 0; i--)
          if (cart[i].memberId === me && ordered.has(String(cart[i].optionId))) cart.splice(i, 1)
      o.deliveries = [
        {
          sellerOrderId: String(nid()),
          sellerId: '2',
          status: 'READY',
          carrier: null,
          trackingNumber: null,
          shippedAt: null,
          deliveredAt: null,
        },
      ]
    }, 2000)
}
const detailOf = ({ memberId: _m, ...o }) => ({ ...o, orderId: String(o.orderId) })
function sizeRecommendationOf(detail, c) {
  const base = { productId: detail.productId, childId: String(c.id), lastPurchasedSize: null }
  const none = (code, message) => ({
    ...base,
    recommendedSize: null,
    fit: null,
    notices: [{ code, message }],
    candidateSizes: [],
  })
  if (detail.sizeFree) return none('SIZE_FREE', '사이즈 구분이 없는 상품이에요.')
  const h = c.heightCm
  const candidates = detail.sizeSpecs
    .filter((s) => s.minHeightCm !== null && h >= s.minHeightCm - 2 && h <= s.maxHeightCm + 2)
    .sort((a, b) => a.minHeightCm - b.minHeightCm)
  if (candidates.length === 0) return none('NO_MATCHING_SIZE', '아이 키에 맞는 사이즈가 없어요.')
  const small = c.bodyType === 'SLIM' || (c.bodyType !== 'CHUNKY' && c.preferredFit === 'SLIM')
  const pick = small ? candidates[0] : candidates[candidates.length - 1]
  const fit = h < pick.minHeightCm ? 'ROOMY' : h > pick.maxHeightCm ? 'TIGHT' : 'PROPER'
  return {
    ...base,
    recommendedSize: pick.size,
    fit,
    notices: [],
    candidateSizes: candidates.map((s) => s.size),
  }
}
/** 자녀에게 맞는 사이즈가 있거나 사이즈 무관인 상품만 맞춤 카드로 (BE RecommendedProductResponse) */
function fitCardsOf(items, c) {
  return items.flatMap((item) => {
    const rec = sizeRecommendationOf(productDetailOf(item.productId), c)
    if (!rec.recommendedSize && !item.sizeFree) return []
    return [
      {
        productId: item.productId,
        name: item.name,
        thumbnailUrl: item.thumbnailUrl,
        businessName: item.businessName,
        minPrice: item.minPrice,
        recommendedSize: rec.recommendedSize,
      },
    ]
  })
}
const childOf = ({ memberId: _m, deleted: _d, growth: _g, ...c }) => c
const lineOf = ({ memberId: _m, ...l }) => ({
  ...l,
  lineAmount: l.unitPrice * l.quantity,
  reserved: isReserved(l),
})
const myAppOf = (a) => ({
  id: a.id,
  businessName: a.businessName,
  representativeName: a.representativeName,
  maskedBusinessRegistrationNumber: a.maskedBusinessRegistrationNumber,
  status: a.status,
  createdAt: a.createdAt,
  decidedAt: a.decidedAt,
  rejectReason: a.rejectReason,
})
const appSummaryOf = (a) => ({
  id: a.id,
  businessName: a.businessName,
  applicantId: a.applicantId,
  applicantNickname: a.applicantNickname,
  maskedBusinessRegistrationNumber: a.maskedBusinessRegistrationNumber,
  status: a.status,
  createdAt: a.createdAt,
})
// 회원 서비스 처리 실패 메시지 (BE #962 {모듈}DeadLetterResponse). failOnReplay = 재처리해도 처리기가 다시 실패하는 메시지
const deadLetters = []
let deadLetterSeq = 1
function addDeadLetter(module, patch = {}) {
  const deadLetterId = String(deadLetterSeq++)
  const d = {
    module,
    failOnReplay: false,
    deadLetterId,
    status: 'OPEN',
    sourceTopic: 'kidly.payment.events',
    sourcePartition: 0,
    sourceOffset: Number(deadLetterId) * 10,
    dltTopic: `kidly.payment.events.${module}.dlt`,
    dltPartition: 0,
    dltOffset: Number(deadLetterId),
    eventType: 'wallet.created',
    eventId: `00000000-0000-4000-8000-${deadLetterId.padStart(12, '0')}`,
    messageKey: '1',
    failureType: 'java.lang.IllegalStateException',
    replayCount: 0,
    lastReplayedBy: null,
    lastReplayedAt: null,
    lastReplayFailureType: null,
    createdAt: now(),
    ...patch,
  }
  deadLetters.push(d)
  return d
}
const deadLetterOf = ({ module: _m, failOnReplay: _f, ...d }) => d
// 주문 처리 실패 메시지 (BE AdminOrderDeadLetterController #601): 칸 · 상태(CLOSED 있음)가 회원 서비스 모듈과 다르다
const orderDeadLetters = []
function addOrderDeadLetter(patch = {}) {
  const deadLetterId = String(deadLetterSeq++)
  const d = {
    failOnReplay: false,
    deadLetterId,
    sourceTopic: 'kidly.payment.events',
    sourcePartition: 0,
    sourceOffset: Number(deadLetterId) * 10,
    messageKey: '1',
    eventType: 'payment.completed',
    eventId: `00000000-0000-4000-9000-${deadLetterId.padStart(12, '0')}`,
    payload: '{"eventType":"payment.completed","orderId":1}',
    producer: 'payment',
    occurredAt: now(),
    aggregateId: '1',
    correlationId: null,
    orderId: '1',
    orderStatus: 'PENDING_PAYMENT',
    failureType: 'PROCESS_FAILED',
    exceptionClass: 'java.lang.IllegalStateException',
    exceptionMessage: '처리 중 오류',
    stackTraceHead:
      'java.lang.IllegalStateException: 처리 중 오류\n\tat com.bbcc.kidly.Order.pay(Order.java:1)',
    firstReceivedAt: now(),
    lastReceivedAt: now(),
    receivedCount: 1,
    status: 'OPEN',
    handledBy: null,
    handledAt: null,
    memo: null,
    reprocessCount: 0,
    lastReprocessedAt: null,
    lastReprocessResult: null,
    recommendedAction: '원인을 고친 뒤 재처리하세요. 결제가 이미 반영됐다면 확인 후 종료하세요.',
    paymentEvent: true,
    ...patch,
  }
  orderDeadLetters.push(d)
  return d
}
const orderDeadLetterOf = ({ failOnReplay: _f, ...d }) => d
const orderDeadLetterNotFound = (res, req) =>
  problem(
    res,
    404,
    'DLT 메시지를 찾을 수 없습니다',
    '없는 DLT 메시지입니다. DLT 메시지 목록을 새로고침해 주세요.',
    req.url,
  )
const orderDeadLetterSummaryOf = (d) => ({
  deadLetterId: d.deadLetterId,
  lastReceivedAt: d.lastReceivedAt,
  failureType: d.failureType,
  eventType: d.eventType,
  orderId: d.orderId,
  receivedCount: d.receivedCount,
  status: d.status,
  paymentEvent: d.paymentEvent,
})
// 시드: 결제 이벤트 처리 대기 1건, 재고 이벤트 읽기 실패 1건(관련 주문 없음)
addOrderDeadLetter()
addOrderDeadLetter({
  sourceTopic: 'kidly.product.events',
  eventType: null,
  eventId: null,
  payload: 'not-json',
  producer: null,
  aggregateId: null,
  orderId: null,
  orderStatus: null,
  failureType: 'READ_FAILED',
  exceptionClass: 'org.springframework.kafka.support.serializer.DeserializationException',
  recommendedAction: '본문을 읽지 못했어요. 보낸 쪽 형식을 확인하세요.',
  paymentEvent: false,
})
// 주소의 모듈 칸 → 모듈 (회원 서비스는 /admin/{모듈}-dead-letters, 커뮤니티는 /admin/community/dead-letters · BE #962 같은 칸)
const dltModule = (segment) => segment.slice(0, -1)
// 커뮤니티: 구매확정 이벤트를 리뷰 작성 가능으로 옮기지 못한 1건
addDeadLetter('community', {
  sourceTopic: 'kidly.order.events',
  dltTopic: 'kidly.order.events.community.dlt',
  eventType: 'order.item-confirmed',
})
// 시연 · 화면 확인용: 회원 모듈에 처리 대기 2건(1건은 재처리도 실패) · 재처리 완료 1건, 판매자 모듈에 헤더 없던 1건, 인증 모듈은 두 페이지
addDeadLetter('member')
addDeadLetter('member', {
  failOnReplay: true,
  eventType: 'order.paid',
  failureType: 'org.springframework.kafka.support.serializer.DeserializationException',
})
addDeadLetter('member', {
  status: 'REPROCESSED',
  replayCount: 1,
  lastReplayedBy: '1',
  lastReplayedAt: now(),
})
addDeadLetter('seller', {
  sourcePartition: null,
  sourceOffset: null,
  eventType: null,
  eventId: null,
  messageKey: null,
  failureType: null,
})
for (let i = 0; i < 21; i++) addDeadLetter('auth')
http
  .createServer(async (req, res) => {
    res.setHeader('access-control-allow-origin', req.headers.origin || '*')
    res.setHeader('access-control-allow-credentials', 'true')
    res.setHeader('access-control-allow-headers', 'authorization,content-type,idempotency-key')
    res.setHeader('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    if (req.method === 'OPTIONS') return send(res, 204)
    let raw = ''
    for await (const c of req) raw += c
    const body = raw ? JSON.parse(raw) : null
    const url = new URL(req.url, 'http://x')
    const p = url.pathname.replace('/api/v1', '')
    const m = req.method
    const u = who(req)
    const r = (method, re) => m === method && p.match(re)
    let x
    if (r('POST', /^\/__fake\/unverify-guardian$/)) {
      delete verifications[body.memberId]
      return send(res, 204)
    }
    // POST /__fake/dead-letters { module, failOnReplay } — 처리 실패 메시지 하나 만들기 (가짜 백엔드 전용).
    // 재처리하면 상태가 바뀌므로 E2E는 실행마다 새 메시지를 만든다
    // POST /__fake/order-dead-letters { failOnReplay } — 주문 처리 실패 메시지 하나 만들기 (가짜 백엔드 전용)
    if (r('POST', /^\/__fake\/order-dead-letters$/)) {
      const d = addOrderDeadLetter({ failOnReplay: Boolean(body.failOnReplay) })
      return send(res, 201, orderDeadLetterOf(d))
    }
    if (r('POST', /^\/__fake\/dead-letters$/)) {
      const d = addDeadLetter(body.module, { failOnReplay: Boolean(body.failOnReplay) })
      return send(res, 201, deadLetterOf(d))
    }
    if (r('POST', /^\/__fake\/payment-stall$/)) {
      stallNext = { timeoutMs: body?.timeoutMs ?? PAYMENT_TIMEOUT_MS }
      return send(res, 204)
    }
    // POST /__fake/age-confirmations { days } — 정산 안 된 구매확정 시각을 며칠 앞으로 (가짜 백엔드 전용).
    // 정산 기준일은 오늘까지만 되므로(BE) 방금 구매확정한 상품을 E2E에서 정산하려고 쓴다
    if (r('POST', /^\/__fake\/age-confirmations$/)) {
      const days = Number(body?.days ?? 1)
      for (const it of orders.flatMap((o) => o.items)) {
        if (it.status !== 'CONFIRMED' || !it.confirmedAt || it.settled) continue
        it.confirmedAt = new Date(Date.parse(`${it.confirmedAt}Z`) - days * 86_400_000)
          .toISOString()
          .slice(0, 19)
      }
      return send(res, 204)
    }
    if (r('POST', /^\/dev\/tokens$/)) {
      // BE Role은 BUYER · SELLER뿐 (BE #762). 그 밖의 값은 읽지 못해 400
      if (!body.roles.every((role) => ['BUYER', 'SELLER'].includes(role)))
        return problem(res, 400, '잘못된 요청입니다', '요청 값을 확인해 주세요.', req.url)
      return send(res, 200, {
        accessToken: `${b64({ alg: 'none' })}.${b64({ sub: String(body.memberId), nickname: body.nickname || '회원' + body.memberId, roles: body.roles })}.sig`,
      })
    }
    if (r('POST', /^\/auth\/reissue$/))
      return problem(res, 401, '로그인이 만료되었습니다', '로그인이 만료되었습니다.', req.url)
    if (r('POST', /^\/auth\/logout$/)) return send(res, 204)
    // 관리자 계정 (BE #736 AdminAuthController). 계정은 BE local 기본 부트스트랩 값 하나
    if (r('POST', /^\/auth\/admin\/login$/)) {
      if (body?.email?.trim().toLowerCase() !== ADMIN.email || body?.password !== ADMIN.password)
        return problem(
          res,
          401,
          '이메일 또는 비밀번호가 올바르지 않습니다',
          '다시 확인해 주세요.',
          req.url,
        )
      return send(
        res,
        200,
        { accessToken: ADMIN.token },
        { 'set-cookie': adminCookie(ADMIN.refresh) },
      )
    }
    if (r('POST', /^\/auth\/admin\/reissue$/)) {
      if (!(req.headers.cookie || '').includes(`admin_refresh_token=${ADMIN.refresh}`))
        return problem(res, 401, '로그인이 만료되었습니다', '로그인이 만료되었습니다.', req.url)
      return send(
        res,
        200,
        { accessToken: ADMIN.token },
        { 'set-cookie': adminCookie(ADMIN.refresh) },
      )
    }
    if (r('POST', /^\/auth\/admin\/logout$/))
      return send(res, 204, undefined, { 'set-cookie': adminCookie('', 0) })
    const childCookie = (value, age = 1209600) =>
      `child_refresh_token=${value}; Path=/api/v1/auth/child; Max-Age=${age}; HttpOnly; SameSite=Lax`
    const childToken = (account) =>
      `${b64({ alg: 'none' })}.${b64({ sub: `child:${account.id}`, guardianId: account.guardianId, version: account.version })}.sig`
    const cookieValue = (req.headers.cookie || '').match(/(?:^|; )child_refresh_token=([^;]*)/)?.[1]
    if (r('POST', /^\/auth\/child\/login$/)) {
      const account = childAccounts.find(
        (a) => a.loginId === body?.loginId && a.password === body?.password,
      )
      if (!account)
        return problem(res, 401, '로그인 실패', '아이디 또는 비밀번호를 확인해 주세요.', req.url)
      return send(
        res,
        200,
        { accessToken: childToken(account) },
        { 'set-cookie': childCookie(`${account.id}.${account.version}`) },
      )
    }
    if (r('POST', /^\/auth\/child\/reissue$/)) {
      const account = childAccounts.find((a) => `${a.id}.${a.version}` === cookieValue)
      if (!account)
        return problem(res, 401, '로그인이 만료되었습니다', '로그인이 만료되었습니다.', req.url)
      return send(
        res,
        200,
        { accessToken: childToken(account) },
        { 'set-cookie': childCookie(cookieValue) },
      )
    }
    if (r('POST', /^\/auth\/child\/logout$/))
      return send(res, 204, undefined, { 'set-cookie': childCookie('', 0) })
    // 공개 API: 카테고리 · 입력 항목 · 상품 상세
    if (r('GET', /^\/categories$/)) {
      const gender = url.searchParams.get('gender')
      if (gender !== null && gender !== 'MALE' && gender !== 'FEMALE')
        return problem(res, 400, '잘못된 요청입니다', 'gender: 값이 올바르지 않습니다.', req.url)
      return send(res, 200, categoryTreeFor(gender))
    }
    if ((x = r('GET', /^\/categories\/(\d+)\/attributes$/))) {
      const inputs = categoryInputs(+x[1])
      return inputs
        ? send(res, 200, inputs)
        : problem(res, 404, '찾을 수 없습니다', '카테고리를 찾을 수 없습니다.', req.url)
    }
    if (r('GET', /^\/products$/)) {
      const sort = url.searchParams.get('sort')
      if (sort && !SORTS.includes(sort))
        return problem(
          res,
          400,
          '잘못된 요청입니다',
          '정렬은 NEWEST, PRICE_ASC, PRICE_DESC, RELEVANCE 중 하나여야 합니다.',
          req.url,
        )
      return send(res, 200, pageFrom(productListOf(url.searchParams), url.searchParams))
    }
    if ((x = r('GET', /^\/products\/(\d+)$/))) {
      const detail = productDetailOf(x[1])
      return detail
        ? send(res, 200, detail)
        : problem(res, 404, '찾을 수 없습니다', '상품을 찾을 수 없습니다.', req.url)
    }
    // 공개 리뷰 API: 상품 리뷰 · 요약 (reviews.mjs)
    const publicReview = publicReviewRoute(m, p, url.searchParams)
    if (publicReview) return reviewResult(res, publicReview, req.url)
    // 공개 찜 API: 찜 수 (favorites.mjs)
    const publicFavorite = publicFavoriteRoute(m, p, url.searchParams)
    if (publicFavorite) return reviewResult(res, publicFavorite, req.url)
    if (!u) return problem(res, 401, '로그인이 필요합니다', '로그인이 필요합니다.', req.url)
    // 검색 결과 클릭 기록 (BE SearchClickRequest): 저장하지 않고 이벤트로만 남기므로 204만 준다
    if (r('POST', /^\/search\/clicks$/)) {
      const invalid = searchClickProblem(body)
      return invalid ? problem(res, 400, '잘못된 요청입니다', invalid, req.url) : send(res, 204)
    }
    // BE #755 Gateway: 관리자 API는 관리자 토큰만, 회원 토큰은 ADMIN 역할이 있어도 403
    if (p.startsWith('/admin/') && !isAdmin(u))
      return problem(res, 403, '권한이 없습니다', '관리자만 할 수 있습니다.', req.url)
    // 관리자 리뷰 검사 (reviews.mjs)
    const adminReview = adminReviewRoute(m, p, url.searchParams, body)
    if (adminReview) return reviewResult(res, adminReview, req.url)
    const isChild = String(u.sub).startsWith('child:')
    if (p.startsWith('/child/')) {
      if (!isChild) return problem(res, 403, '권한이 없습니다', '자녀만 볼 수 있습니다.', req.url)
      const account = childAccounts.find(
        (a) => `child:${a.id}` === u.sub && a.version === u.version,
      )
      if (!account)
        return problem(res, 401, '로그인이 만료되었습니다', '로그인이 만료되었습니다.', req.url)
      // 가정 계약 (childprofile 확정 전)
      const profile = children.find((c) => c.id === account.childProfileId && !c.deleted)
      if (r('GET', /^\/child\/onboarding$/)) {
        if (!profile)
          return problem(res, 404, '찾을 수 없습니다', '프로필을 찾을 수 없습니다.', req.url)
        return send(res, 200, { noticeConfirmed: !!account.noticeConfirmed })
      }
      if (r('POST', /^\/child\/onboarding\/notice$/)) {
        if (!profile)
          return problem(res, 404, '찾을 수 없습니다', '프로필을 찾을 수 없습니다.', req.url)
        account.noticeConfirmed = true
        return send(res, 204)
      }
      // 자녀 알림함 (BE ChildInboxNotificationController, 받는 사람 = 자녀 계정)
      const childInbox = notificationRoute(m, p, url.searchParams, `child:${account.id}`, 'child')
      if (childInbox) return reviewResult(res, childInbox, req.url)
      if (r('GET', /^\/child\/profile$/)) {
        const child = children.find((c) => c.id === account.childProfileId && !c.deleted)
        return child
          ? send(res, 200, childOf(child))
          : problem(res, 404, '찾을 수 없습니다', '프로필을 찾을 수 없습니다.', req.url)
      }
    }
    // BE ChildPurchaseController (#1000): 자녀만(회원 403). 결제된 적 있는 주문에서 내가 입을 아이인 주문상품, 주문 일시 최신순
    if (r('GET', /^\/orders\/items\/mine$/)) {
      if (!isChild) return problem(res, 403, '권한이 없습니다', '자녀만 볼 수 있습니다.', req.url)
      const account = childAccounts.find(
        (a) => `child:${a.id}` === u.sub && a.version === u.version,
      )
      if (!account)
        return problem(res, 401, '로그인이 만료되었습니다', '로그인이 만료되었습니다.', req.url)
      const childId = String(account.childProfileId)
      const paidBefore = (o) =>
        o.status === 'PAID' ||
        ['BUYER_CANCELLED', 'SELLER_CANCELLED', 'SELLER_UNAVAILABLE'].includes(o.cancelReason)
      const statusOf = (o, it) => {
        if (o.status === 'CANCELLED' || it.status === 'CANCELLED') return 'CANCELLED'
        if (it.status === 'CONFIRMED') return 'CONFIRMED'
        const d = o.deliveries.find((each) => each.sellerId === it.sellerId)
        return d && (d.status === 'SHIPPING' || d.status === 'DELIVERED') ? d.status : 'PAID'
      }
      const rows = orders
        .filter(paidBefore)
        .flatMap((o) =>
          o.items
            .filter((it) => it.child?.childId === childId)
            .map((it) => ({
              orderItemId: it.orderItemId,
              orderedAt: o.orderedAt,
              productId: it.productId,
              productName: it.productName,
              optionName: it.optionName,
              quantity: it.quantity,
              status: statusOf(o, it),
            })),
        )
        .sort((a, b) => b.orderedAt.localeCompare(a.orderedAt))
      return send(res, 200, page(rows))
    }
    // 장바구니 · 조르기는 회원과 자녀(자녀 토큰)를 함께 받는다 (BE @CartCaller · @WishCaller, #998 · #999)
    if (/^\/(cart|wish\/requests)(\/|$)/.test(p)) {
      let actor
      if (isChild) {
        const account = childAccounts.find(
          (a) => `child:${a.id}` === u.sub && a.version === u.version,
        )
        if (!account)
          return problem(res, 401, '로그인이 만료되었습니다', '로그인이 만료되었습니다.', req.url)
        const profile = children.find((c) => c.id === account.childProfileId && !c.deleted)
        if (!profile) return cartProblem(res, 'CHILD_ACCOUNT_FORBIDDEN', req.url)
        actor = {
          type: 'CHILD',
          id: String(profile.id),
          owner: `child:${profile.id}`,
          childId: String(profile.id),
          guardianId: account.guardianId,
        }
      } else {
        const me = Number(u.sub)
        actor = { type: 'MEMBER', id: String(me), owner: me, childId: null, guardianId: me }
      }
      if (r('GET', /^\/cart$/)) {
        const items = cart.filter((l) => l.memberId === actor.owner).map(lineOf)
        return send(res, 200, { items, totalAmount: items.reduce((s, l) => s + l.lineAmount, 0) })
      }
      if (r('POST', /^\/cart\/items$/)) {
        if (badQuantity(body.quantity)) return cartProblem(res, 'INVALID_QUANTITY', req.url)
        if (
          actor.type === 'CHILD' &&
          body.childId != null &&
          String(body.childId) !== actor.childId
        )
          return cartProblem(res, 'CHILD_CART_CHILD_FIXED', req.url)
        const rp = replica[body.optionId]
        if (!rp) return cartProblem(res, 'PRODUCT_OPTION_NOT_FOUND', req.url)
        const childId = actor.childId ?? (body.childId ? String(body.childId) : null)
        // BE: 같은 주인 · 옵션 · 자녀면 같은 줄에 수량을 더하고 200
        const existing = cart.find(
          (l) =>
            l.memberId === actor.owner &&
            l.optionId === String(body.optionId) &&
            l.childId === childId,
        )
        if (existing) {
          if (isReserved(existing)) return cartProblem(res, 'CART_ITEM_RESERVED', req.url)
          if (badQuantity(existing.quantity + body.quantity))
            return cartProblem(res, 'INVALID_QUANTITY', req.url)
          existing.quantity += body.quantity
          return send(res, 200, lineOf(existing))
        }
        const l = {
          cartItemId: String(nid()),
          memberId: actor.owner,
          optionId: String(body.optionId),
          productId: String(rp.productId),
          sellerId: String(rp.sellerId),
          sellerName: '테스트상점',
          productName: rp.name,
          optionName: rp.optionName,
          size: rp.size,
          childId,
          quantity: body.quantity,
          unitPrice: rp.price,
          purchasable: true,
        }
        cart.push(l)
        return send(res, 201, lineOf(l))
      }
      if (
        (x = r('PATCH', /^\/cart\/items\/(\d+)$/)) ||
        (x = r('DELETE', /^\/cart\/items\/(\d+)$/))
      ) {
        const index = cart.findIndex((l) => l.cartItemId === x[1])
        if (index < 0) return cartProblem(res, 'CART_ITEM_NOT_FOUND', req.url)
        if (cart[index].memberId !== actor.owner) return cartProblem(res, 'CART_FORBIDDEN', req.url)
        if (isReserved(cart[index])) return cartProblem(res, 'CART_ITEM_RESERVED', req.url)
        if (req.method === 'DELETE') {
          cart.splice(index, 1)
          return send(res, 204)
        }
        if (badQuantity(body.quantity)) return cartProblem(res, 'INVALID_QUANTITY', req.url)
        cart[index].quantity = body.quantity
        return send(res, 200, lineOf(cart[index]))
      }
      // 볼 수 있는 조르기: 보낸 사람이거나 승인자(받는 자녀의 보호자)
      const visible = (wish) =>
        (wish.requestedByType === actor.type && wish.requestedById === actor.id) ||
        (actor.type === 'MEMBER' &&
          children.some((c) => String(c.id) === wish.childId && c.memberId === Number(actor.id)))
      const findWish = (wishId) => wishRequests.find((w) => w.requestId === wishId && visible(w))
      if (r('POST', /^\/wish\/requests$/)) {
        if (actor.type !== 'CHILD') return wishProblem(res, 'WISH_REQUEST_SEND_FORBIDDEN', req.url)
        const ids = body.cartItemIds
        if (
          !Array.isArray(ids) ||
          !ids.length ||
          new Set(ids.map(String)).size !== ids.length ||
          (body.message?.length ?? 0) > 100
        )
          return wishProblem(res, 'INVALID_WISH_REQUEST', req.url)
        const lines = ids.map((id) => cart.find((l) => l.cartItemId === String(id)))
        if (lines.some((l) => l && isReserved(l)))
          return wishProblem(res, 'WISH_ITEM_IN_REQUEST', req.url)
        if (lines.some((l) => !l || l.memberId !== actor.owner))
          return cartProblem(res, 'CART_ITEM_NOT_FOUND', req.url)
        const wish = {
          requestId: String(nid()),
          type: 'WISH',
          childId: actor.childId,
          status: 'REQUESTED',
          requestedByType: 'CHILD',
          requestedById: actor.id,
          message: body.message || null,
          requestedAt: now(),
          payerType: null,
          payerId: null,
          paidAt: null,
          rejectReason: null,
          rejectedAt: null,
          cancelReason: null,
          cancelledAt: null,
          expiresAt: null,
          expiredAt: null,
          items: lines.map((l) => ({
            cartItemId: l.cartItemId,
            optionId: l.optionId,
            productId: l.productId,
            sellerId: l.sellerId,
            productName: l.productName,
            optionName: l.optionName,
            size: l.size,
            sellerName: l.sellerName,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            purchasable: l.purchasable,
            saleStatus: 'ON_SALE',
            purchased: false,
          })),
          purchases: [],
          paidOrderItemIds: [],
        }
        wish.expiresAt = wishExpiresAt(wish.requestedAt)
        wishRequests.push(wish)
        return send(res, 201, wish, { location: `/api/v1/wish/requests/${wish.requestId}` })
      }
      if (r('GET', /^\/wish\/requests$/)) {
        const childId = url.searchParams.get('childId')
        return send(
          res,
          200,
          wishRequests
            .filter((wish) => visible(wish) && (!childId || wish.childId === childId))
            .slice()
            .reverse(),
        )
      }
      if ((x = r('POST', /^\/wish\/requests\/(\d+)\/rejection$/))) {
        const wish = findWish(x[1])
        if (!wish) return wishProblem(res, 'WISH_REQUEST_NOT_FOUND', req.url)
        if (actor.type !== 'MEMBER')
          return wishProblem(res, 'WISH_REQUEST_DECIDE_FORBIDDEN', req.url)
        if (!WISH_REJECT_REASONS.includes(body.reason))
          return wishProblem(res, 'INVALID_REJECT_REASON', req.url)
        if (wish.status !== 'REQUESTED')
          return wishProblem(res, 'WISH_REQUEST_ALREADY_DECIDED', req.url)
        wish.status = 'REJECTED'
        wish.expiresAt = null
        wish.rejectReason = body.reason
        wish.rejectedAt = now()
        return send(res, 200, wish)
      }
      // BE #968: 보낸 사람만, 처리 전 · 기한 전에만. 예약이 풀리고 칸은 장바구니에 남는다
      if ((x = r('POST', /^\/wish\/requests\/(\d+)\/cancellation$/))) {
        const wish = findWish(x[1])
        if (!wish) return wishProblem(res, 'WISH_REQUEST_NOT_FOUND', req.url)
        if (wish.requestedByType !== actor.type || wish.requestedById !== actor.id)
          return wishProblem(res, 'WISH_REQUEST_CANCEL_FORBIDDEN', req.url)
        if (wish.status === 'REQUESTED' && wish.expiresAt && wish.expiresAt <= now())
          return wishProblem(res, 'WISH_REQUEST_EXPIRED', req.url)
        if (wish.status !== 'REQUESTED')
          return wishProblem(res, 'WISH_REQUEST_ALREADY_DECIDED', req.url)
        wish.status = 'CANCELLED'
        wish.cancelReason = 'DIRECT'
        wish.cancelledAt = now()
        wish.expiresAt = null
        return send(res, 200, wish)
      }
      if ((x = r('GET', /^\/wish\/requests\/(\d+)(\/timeline)?$/))) {
        const wish = findWish(x[1])
        if (!wish) return wishProblem(res, 'WISH_REQUEST_NOT_FOUND', req.url)
        if (!x[2]) return send(res, 200, wish)
        // BE WishTimelineView: 보냄 → 결제 완료(대기 · 완료) 또는 거절 · 철회 하나
        const decided = {
          PAID: wish.paidAt,
          REJECTED: wish.rejectedAt,
          CANCELLED: wish.cancelledAt,
        }
        return send(res, 200, {
          requestId: wish.requestId,
          status: wish.status,
          rejectReason: wish.rejectReason,
          cancelReason: wish.cancelReason,
          orderIds: [...new Set(wish.purchases.map((purchase) => purchase.orderId))],
          steps: [
            { step: 'SENT', status: 'DONE', at: wish.requestedAt },
            wish.status === 'REQUESTED'
              ? { step: 'PAID', status: 'WAITING', at: null }
              : { step: wish.status, status: 'DONE', at: decided[wish.status] },
          ],
          cancelledBy: null,
        })
      }
      return problem(res, 404, 'Not Found', `No static resource api/v1${p}.`, req.url)
    }
    if (isChild) return problem(res, 401, '로그인이 필요합니다', '로그인이 필요합니다.', req.url)
    const me = Number(u.sub)
    // 회원 알림함 (BE InboxNotificationController)
    const memberInbox = notificationRoute(m, p, url.searchParams, `member:${me}`, 'member')
    if (memberInbox) return reviewResult(res, memberInbox, req.url)
    // 회원 리뷰 API: 내 리뷰 · 작성 가능 목록 · 쓰기 · 고치기 · 지우기 · 사진 업로드 주소 (reviews.mjs)
    const memberReview = memberReviewRoute(m, p, url.searchParams, body, {
      memberId: me,
      nickname: u.nickname ?? null,
      orders,
    })
    if (memberReview) return reviewResult(res, memberReview, req.url)
    // 회원 찜 API: 찜 · 해제 · 내 찜 (favorites.mjs)
    const memberFavorite = memberFavoriteRoute(m, p, url.searchParams, {
      memberId: me,
      productView: favoriteProductView,
    })
    if (memberFavorite) return reviewResult(res, memberFavorite, req.url)
    if (r('GET', /^\/guardian-verification$/)) {
      const verifiedAt = verifications[me] ?? null
      return send(res, 200, { verified: verifiedAt !== null, verifiedAt })
    }
    if (r('POST', /^\/guardian-verification$/)) {
      if (verifications[me])
        return problem(res, 409, '이미 본인인증했습니다', '이미 본인인증했습니다', req.url)
      verifications[me] = now()
      return send(res, 201, { verified: true, verifiedAt: verifications[me] })
    }
    const accountDto = (a) => ({ id: a.id, childProfileId: a.childProfileId, loginId: a.loginId })
    if (r('GET', /^\/auth\/child-accounts$/))
      return send(res, 200, childAccounts.filter((a) => a.guardianId === me).map(accountDto))
    if (r('POST', /^\/auth\/child-accounts$/)) {
      if (!children.some((c) => c.id === body.childProfileId && c.memberId === me && !c.deleted))
        return problem(res, 404, '찾을 수 없습니다', '자녀를 찾을 수 없습니다.', req.url)
      if (!/^[a-z0-9]{4,20}$/.test(body.loginId) || body.password.length < 8)
        return problem(res, 400, '잘못된 요청', '아이디 또는 비밀번호를 확인해 주세요.', req.url)
      if (
        childAccounts.some(
          (a) => a.childProfileId === body.childProfileId || a.loginId === body.loginId,
        )
      )
        return problem(res, 409, '이미 존재합니다', '이미 등록된 계정입니다.', req.url)
      const account = {
        id: nid(),
        childProfileId: body.childProfileId,
        loginId: body.loginId,
        password: body.password,
        guardianId: me,
        version: 1,
      }
      childAccounts.push(account)
      return send(res, 201, accountDto(account))
    }
    if ((x = r('PATCH', /^\/auth\/child-accounts\/(\d+)\/password$/))) {
      const account = childAccounts.find((a) => a.id === +x[1] && a.guardianId === me)
      if (!account)
        return problem(res, 404, '찾을 수 없습니다', '계정을 찾을 수 없습니다.', req.url)
      if (body.password.length < 8)
        return problem(res, 400, '잘못된 요청', '비밀번호를 확인해 주세요.', req.url)
      account.password = body.password
      account.version++
      return send(res, 204)
    }
    if ((x = r('DELETE', /^\/auth\/child-accounts\/(\d+)$/))) {
      const index = childAccounts.findIndex((a) => a.id === +x[1] && a.guardianId === me)
      if (index < 0)
        return problem(res, 404, '찾을 수 없습니다', '계정을 찾을 수 없습니다.', req.url)
      childAccounts.splice(index, 1)
      return send(res, 204)
    }
    // 정산: 구매확정된 주문상품이 대상, 실행하면 판매자별 정산서 → 바로 예치금 입금(PAID)
    const confirmedItems = () =>
      orders.flatMap((o) =>
        o.items
          .filter((it) => it.status === 'CONFIRMED' && it.confirmedAt)
          .map((it) => ({ order: o, item: it })),
      )
    const itemOf = ({ order, item }) => ({
      orderItemId: Number(item.orderItemId),
      orderId: Number(order.orderId),
      salesAmount: item.amount,
      confirmedAt: item.confirmedAt,
    })
    const summaryOf = ({ sellerId: _s, items: _i, failReason: _f, ...st }) => st
    // BE: 정산 예정일 = 확정일 다음 영업일 (가짜 백엔드는 주말만 건너뛴다)
    const nextBusinessDay = (dateTime) => {
      const day = new Date(`${dateTime.slice(0, 10)}T00:00:00Z`)
      do day.setUTCDate(day.getUTCDate() + 1)
      while (day.getUTCDay() === 0 || day.getUTCDay() === 6)
      return day.toISOString().slice(0, 10)
    }
    const myTargets = () =>
      confirmedItems().filter((x) => String(x.item.sellerId) === String(me) && !x.item.settled)
    if (r('GET', /^\/seller\/settlement-targets$/))
      return send(
        res,
        200,
        page(
          myTargets().map((x) => ({
            ...itemOf(x),
            expectedPayoutOn: nextBusinessDay(x.item.confirmedAt),
          })),
        ),
      )
    if (r('GET', /^\/seller\/settlement-targets\/summary$/))
      return send(res, 200, {
        totalSalesAmount: myTargets().reduce((sum, x) => sum + x.item.amount, 0),
      })
    if (r('GET', /^\/seller\/settlements$/))
      return send(
        res,
        200,
        page(
          settlements
            .filter((st) => st.sellerId === me)
            .slice()
            .reverse()
            .map(summaryOf),
        ),
      )
    if ((x = r('GET', /^\/seller\/settlements\/(\d+)$/))) {
      const st = settlements.find((st) => st.settlementId === +x[1] && st.sellerId === me)
      if (!st) return problem(res, 404, '찾을 수 없습니다', '정산서를 찾을 수 없습니다.', req.url)
      const { sellerId: _s, ...detail } = st
      return send(res, 200, detail)
    }
    if (r('POST', /^\/admin\/settlements\/run$/)) {
      if (!isAdmin(u))
        return problem(res, 403, '권한이 없습니다', '관리자만 실행할 수 있습니다.', req.url)
      const cutoffOn = body?.cutoffOn
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoffOn ?? ''))
        return problem(res, 400, '잘못된 요청입니다', '종료 기준일을 넣어 주세요.', req.url)
      // BE: 수동 실행 기준일은 오늘 또는 지난 날짜 (SettlementPeriod.manual)
      if (cutoffOn > now().slice(0, 10))
        return problem(
          res,
          400,
          '정산 기준일이 올바르지 않습니다',
          '오늘 또는 지난 날짜로 지정해 주세요.',
          req.url,
        )
      if (settlementRuns.some((run) => run.cutoffAt.startsWith(cutoffOn)))
        return problem(res, 409, '이미 정산했습니다', '이미 정산한 기준일입니다.', req.url)
      const due = confirmedItems().filter(
        (x) => !x.item.settled && x.item.confirmedAt < `${cutoffOn}T00:00:00`,
      )
      const end = new Date(Date.parse(`${cutoffOn}T00:00:00Z`) - 86_400_000)
        .toISOString()
        .slice(0, 10)
      const start = due.map((x) => x.item.confirmedAt.slice(0, 10)).sort()[0] ?? end
      const sellers = [...new Set(due.map((x) => Number(x.item.sellerId)))]
      for (const sellerId of sellers) {
        const mine = due.filter((x) => Number(x.item.sellerId) === sellerId)
        const total = mine.reduce((sum, x) => sum + x.item.amount, 0)
        const fee = Math.floor(total * 0.1)
        const st = {
          settlementId: nid(),
          sellerId,
          periodStartOn: start,
          periodEndOn: end,
          totalSalesAmount: total,
          feeRate: 0.1,
          feeAmount: fee,
          settlementAmount: total - fee,
          status: 'PAID',
          completedAt: now(),
          paidAt: now(),
          failReason: null,
          items: mine.map(itemOf),
        }
        mine.forEach((x) => (x.item.settled = true))
        settlements.push(st)
        // settlement.payout-requested → 결제가 판매자 예치금에 입금
        wallets[sellerId] = (wallets[sellerId] ?? 0) + st.settlementAmount
        ledger(sellerId, 'SETTLEMENT', st.settlementAmount, String(st.settlementId))
      }
      const run = {
        runId: nid(),
        cutoffAt: `${cutoffOn}T00:00:00`,
        periodStartOn: start,
        periodEndOn: end,
        triggerType: 'MANUAL',
        status: 'COMPLETED',
        successCount: sellers.length,
        failCount: 0,
        requestedBy: me,
        startedAt: now(),
        finishedAt: now(),
        skippedSellers: [],
      }
      settlementRuns.push(run)
      return send(res, 201, run)
    }
    // 관리자 정산서 목록 (BE AdminSettlementSummaryResponse = 판매자 응답 + sellerId · failReason)
    if (r('GET', /^\/admin\/settlements$/)) {
      const status = url.searchParams.get('status')
      // BE @Pattern(COMPLETED|PAID|FAILED)
      if (status && !['COMPLETED', 'PAID', 'FAILED'].includes(status))
        return problem(res, 400, '잘못된 요청입니다', '요청 값을 확인해 주세요.', req.url)
      const rows = settlements
        .filter((st) => !status || st.status === status)
        .slice()
        .reverse()
        .map(({ items: _i, ...st }) => st)
      return send(res, 200, pageFrom(rows, url.searchParams))
    }
    // 지급 재요청: 지급 결과를 받지 못한 정산서(COMPLETED)만 (BE SETTLEMENT_NOT_RETRYABLE 409)
    if ((x = r('POST', /^\/admin\/settlements\/(\d+)\/retry$/))) {
      const st = settlements.find((st) => st.settlementId === +x[1])
      if (!st) return problem(res, 404, '찾을 수 없습니다', '정산서를 찾을 수 없습니다.', req.url)
      if (st.status !== 'COMPLETED')
        return problem(
          res,
          409,
          '지급을 다시 요청할 수 없는 정산서입니다',
          '지급 결과를 받지 못한 정산서(COMPLETED)만 다시 요청할 수 있습니다.',
          req.url,
        )
      Object.assign(st, { status: 'PAID', paidAt: now() })
      wallets[st.sellerId] = (wallets[st.sellerId] ?? 0) + st.settlementAmount
      ledger(st.sellerId, 'SETTLEMENT', st.settlementAmount, String(st.settlementId))
      return send(res, 204)
    }
    if ((x = r('GET', /^\/admin\/settlement-runs\/(\d+)$/))) {
      const run = settlementRuns.find((run) => run.runId === +x[1])
      return run
        ? send(res, 200, run)
        : problem(res, 404, '찾을 수 없습니다', '정산 실행을 찾을 수 없습니다.', req.url)
    }
    // 기준 옷 「산 옷에서 고르기」 (BE #1168): 이 자녀의 구매확정된 주문상품, 확정이 늦은 순서.
    // 상품 정보가 없으면 이름 · 카테고리 · 칸 · 실측이 null, 산 사이즈의 실측이 없으면 실측만 null
    if ((x = r('GET', /^\/recommendations\/children\/(\d+)\/purchases$/))) {
      const c = children.find((c) => c.id === +x[1] && !c.deleted)
      if (!c)
        return problem(res, 404, '자녀를 찾을 수 없습니다', '자녀를 찾을 수 없습니다.', req.url)
      if (c.memberId !== me)
        return problem(
          res,
          403,
          '자녀에 접근할 수 없습니다',
          '로그인한 보호자의 자녀만 다룰 수 있습니다.',
          req.url,
        )
      const content = orders
        .flatMap((o) => o.items)
        .filter((it) => it.status === 'CONFIRMED' && it.size && it.child?.childId === String(c.id))
        .sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt))
        .map((it) => {
          const detail = productDetailOf(it.productId)
          const spec = detail?.sizeSpecs.find((s) => s.size === it.size)
          return {
            orderItemId: it.orderItemId,
            productId: it.productId,
            productName: detail?.name ?? null,
            categoryId: detail?.categoryId ?? null,
            part: detail ? garmentPartOfCategory(detail.categoryId) : null,
            size: it.size,
            measurements: spec?.measurements ?? null,
            confirmedAt: it.confirmedAt,
          }
        })
      return send(res, 200, pageFrom(content, url.searchParams))
    }
    // 추천 기준 옷 (reference-garments.mjs): 남의 자녀는 403, 없거나 지운 자녀는 404
    const garment = referenceGarmentRoute(m, p, body, (childId) => {
      const c = children.find((c) => c.id === +childId && !c.deleted)
      if (!c) return 'missing'
      return c.memberId === me ? 'ok' : 'forbidden'
    })
    if (garment) {
      const result = garment()
      return result.title
        ? problem(res, result.status, result.title, result.detail, req.url)
        : send(res, result.status, result.body)
    }
    // 상세 진입 기록 (BE #1112): 추천이 회원 활동으로 센다. 기록은 흉내 내지 않고 상품 · 자녀만 검사한다
    if (r('POST', /^\/recommendations\/product-views$/)) {
      const productId = body?.productId
      if (productId === undefined || productId === null)
        return problem(res, 400, '잘못된 요청입니다', 'productId: 상품 ID가 필요합니다.', req.url)
      if (!(Number(productId) > 0))
        return problem(
          res,
          400,
          '잘못된 요청입니다',
          'productId: 상품 ID는 1 이상이어야 합니다.',
          req.url,
        )
      const childId = body.childId
      if (childId !== undefined && childId !== null) {
        if (!(Number(childId) > 0))
          return problem(
            res,
            400,
            '잘못된 요청입니다',
            'childId: 자녀 ID는 1 이상이어야 합니다.',
            req.url,
          )
        const c = children.find((c) => c.id === +childId && c.memberId === me && !c.deleted)
        if (!c)
          return problem(res, 404, '자녀를 찾을 수 없습니다', '자녀를 찾을 수 없습니다.', req.url)
      }
      return send(res, 204)
    }
    // 자녀 맞춤 목록 (BE #316 · #681 · #1151): 판매 중 상품 중 자녀에게 맞는 사이즈가 있는 것, 최신순.
    // 응답에 목록 기준 시각 asOf (1쪽은 지금, 2쪽부터 받은 asOf 그대로). 지금보다 늦거나 형식이 틀리면 400
    if (r('GET', /^\/recommendations\/products$/)) {
      const childId = url.searchParams.get('childId')
      if (!childId) return problem(res, 400, '잘못된 요청입니다', 'childId는 필수입니다.', req.url)
      const asOf = url.searchParams.get('asOf') ?? now()
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(asOf) || asOf > now())
        return problem(
          res,
          400,
          '잘못된 기준 시각입니다',
          '기준 시각이 올바르지 않습니다.',
          req.url,
        )
      const c = children.find((c) => c.id === +childId && c.memberId === me && !c.deleted)
      if (!c)
        return problem(res, 404, '자녀를 찾을 수 없습니다', '자녀를 찾을 수 없습니다.', req.url)
      // 말단 카테고리만 거른다 (BE: 정확히 같은 categoryId)
      const categoryId = url.searchParams.get('categoryId')
      const byCategory = new URLSearchParams(categoryId ? { categoryId } : {})
      const content = fitCardsOf(productListOf(byCategory), c)
      return send(res, 200, { ...pageFrom(content, url.searchParams), asOf })
    }
    // 홈 맛보기 (BE #1163): 맞춤 목록 앞 4개. AI 흉내는 선택 동의한 자녀면 AI(앞 두 개만 이유), 아니면 RULE(이유 모두 null)
    if (r('GET', /^\/recommendations\/products\/preview$/)) {
      const childId = url.searchParams.get('childId')
      if (!childId) return problem(res, 400, '잘못된 요청입니다', 'childId는 필수입니다.', req.url)
      const c = children.find((c) => c.id === +childId && c.memberId === me && !c.deleted)
      if (!c)
        return problem(res, 404, '자녀를 찾을 수 없습니다', '자녀를 찾을 수 없습니다.', req.url)
      const source = c.hasOptionalConsent ? 'AI' : 'RULE'
      const products = fitCardsOf(productListOf(new URLSearchParams()), c)
        .slice(0, 4)
        .map((card, index) => ({
          ...card,
          reason:
            source === 'AI' && index < 2 ? `키 ${c.heightCm}cm에 맞는 사이즈가 있어요.` : null,
        }))
      return sendPicks(req, res, { source, products })
    }
    // 함께 사면 좋은 상품 (BE #1164): 보고 있는 상품과 다른 카테고리 중 자녀에게 맞는 상품 4개까지.
    // AI 흉내: 상품 ID가 홀수면 AI가 앞 두 개에 이유를 쓰고(나머지는 규칙으로 채워 null), 짝수면 AI를 못 쓴 RULE(이유 모두 null)
    if (r('GET', /^\/recommendations\/companions$/)) {
      const productId = url.searchParams.get('productId')
      const childId = url.searchParams.get('childId')
      if (!productId || !childId)
        return problem(res, 400, '잘못된 요청입니다', 'productId · childId는 필수입니다.', req.url)
      const detail = productDetailOf(productId)
      if (!detail)
        return problem(res, 404, '상품을 찾을 수 없습니다', '상품을 찾을 수 없습니다.', req.url)
      const c = children.find((c) => c.id === +childId && c.memberId === me && !c.deleted)
      if (!c)
        return problem(res, 404, '자녀를 찾을 수 없습니다', '자녀를 찾을 수 없습니다.', req.url)
      const others = productListOf(new URLSearchParams()).filter(
        (item) => productDetailOf(item.productId).categoryId !== detail.categoryId,
      )
      const source = Number(productId) % 2 === 1 ? 'AI' : 'RULE'
      const products = fitCardsOf(others, c)
        .slice(0, 4)
        .map((card, index) => ({
          ...card,
          reason: source === 'AI' && index < 2 ? `${detail.name}과 함께 입기 좋아요.` : null,
        }))
      return sendPicks(req, res, { source, products })
    }
    // BE 관리자 처리 대기 (#353 결제 반영 실패 · #449 받은 이벤트 처리 실패 · #602 격리 아웃박스). 가짜는 기록 하나씩으로 시작한다
    if (r('GET', /^\/admin\/orders\/recoveries$/)) {
      const status = url.searchParams.get('status')
      return send(res, 200, page(opsRecoveries.filter((x) => !status || x.status === status)))
    }
    if ((x = r('POST', /^\/admin\/orders\/recoveries\/(\d+)\/(retry|cancel)$/))) {
      const rec = opsRecoveries.find((each) => each.recoveryId === x[1])
      if (!rec)
        return problem(
          res,
          404,
          '기록을 찾을 수 없습니다',
          '결제 반영 실패 기록을 찾을 수 없습니다.',
          req.url,
        )
      if (rec.status === 'PENDING') {
        rec.status = x[2] === 'retry' ? 'RECOVERED' : 'CANCELLED'
        rec.attemptCount += x[2] === 'retry' ? 1 : 0
        rec.lastAttemptedAt = now()
      }
      return send(res, 200, rec)
    }
    if (r('GET', /^\/admin\/orders\/event-failures$/)) {
      const status = url.searchParams.get('status')
      return send(res, 200, page(opsEventFailures.filter((x) => !status || x.status === status)))
    }
    if ((x = r('POST', /^\/admin\/orders\/event-failures\/(\d+)\/(retry|cancel)$/))) {
      const rec = opsEventFailures.find((each) => each.failureId === x[1])
      if (!rec)
        return problem(
          res,
          404,
          '기록을 찾을 수 없습니다',
          '이벤트 처리 실패 기록을 찾을 수 없습니다.',
          req.url,
        )
      if (rec.status === 'PENDING') {
        rec.status = x[2] === 'retry' ? 'RECOVERED' : 'CANCELLED'
        rec.attemptCount += x[2] === 'retry' ? 1 : 0
        rec.lastAttemptedAt = now()
      }
      return send(res, 200, rec)
    }
    if (r('GET', /^\/admin\/orders\/outbox\/quarantined$/))
      return send(res, 200, page(opsOutbox.filter((x) => x.status === 'QUARANTINED')))
    if ((x = r('POST', /^\/admin\/orders\/outbox\/(\d+)\/retry$/))) {
      const rec = opsOutbox.find((each) => each.outboxId === x[1])
      if (!rec)
        return problem(
          res,
          404,
          '아웃박스를 찾을 수 없습니다',
          '아웃박스 메시지를 찾을 수 없습니다.',
          req.url,
        )
      if (rec.status === 'SENT')
        return problem(
          res,
          409,
          '이미 보낸 메시지입니다',
          '이미 보낸 메시지라 다시 보낼 수 없습니다.',
          req.url,
        )
      Object.assign(rec, {
        status: 'PENDING',
        quarantinedAt: null,
        lastRetriedAt: now(),
        lastRetriedBy: '1',
        retryCount: rec.retryCount + 1,
      })
      return send(res, 200, rec)
    }
    // BE StuckOrderController (#445 · #926): 종류별 건수(모든 종류 0 포함) · 종류별 목록(오래된 것부터).
    // 가짜는 발송 준비로 남은 배송만 발송 지연으로 보고, AI 메모는 가짜 공급자(fake)가 쓴 것처럼 붙인다
    const STUCK_KIND_ORDER = [
      'STOCK_CHECK_STALE',
      'PAYMENT_EXPIRY_MISSED',
      'PAID_WITHOUT_DELIVERY',
      'RECOVERY_PENDING_STALE',
      'SHIPPING_DELAYED',
      'AUTO_CONFIRM_MISSED',
      'OUTBOX_STUCK',
    ]
    const shippingDelayed = () =>
      orders
        .filter((o) => o.status === 'PAID')
        .flatMap((o) => o.deliveries.filter((d) => d.status === 'READY').map((d) => ({ o, d })))
        .map(({ o, d }) => ({
          kind: 'SHIPPING_DELAYED',
          orderId: String(o.orderId),
          targetType: 'DELIVERY',
          targetId: d.sellerOrderId,
          status: 'READY',
          since: o.orderedAt,
          outbox: null,
          aiMemo: {
            summary: '판매자가 아직 송장을 등록하지 않았어요.',
            recommendedAction: '판매자에게 발송을 요청하고, 어려우면 판매자 취소를 안내하세요.',
            confidence: 'MEDIUM',
            provider: 'fake',
            model: 'fake',
            createdAt: o.orderedAt,
          },
        }))
    if (r('GET', /^\/admin\/orders\/stuck\/summary$/))
      return send(
        res,
        200,
        Object.fromEntries(
          STUCK_KIND_ORDER.map((kind) => [
            kind,
            kind === 'SHIPPING_DELAYED' ? shippingDelayed().length : 0,
          ]),
        ),
      )
    if (r('GET', /^\/admin\/orders\/stuck$/)) {
      const kind = url.searchParams.get('kind')
      if (!STUCK_KIND_ORDER.includes(kind))
        return problem(
          res,
          400,
          '잘못된 멈춘 주문 종류입니다',
          `kind는 ${STUCK_KIND_ORDER.join(' · ')} 중 하나입니다.`,
          req.url,
        )
      return send(res, 200, page(kind === 'SHIPPING_DELAYED' ? shippingDelayed() : []))
    }
    // BE AdminOrderController GET /admin/orders/{orderId}/history (#442): 오래된 것부터, 주문이 없으면 404
    if ((x = r('GET', /^\/admin\/orders\/(\d+)\/history$/))) {
      const o = orders.find((order) => order.orderId === +x[1])
      if (!o)
        return problem(res, 404, '주문을 찾을 수 없습니다', '주문을 찾을 수 없습니다.', req.url)
      return send(res, 200, o.history ?? [])
    }
    // BE OrderDeadLetterService (#601): 기본 OPEN, 결제 토픽이 먼저 · 그 안은 최근 받은 것부터
    if (r('GET', /^\/admin\/orders\/dead-letters$/)) {
      const status = url.searchParams.get('status') ?? 'OPEN'
      if (!['OPEN', 'REPROCESSED', 'CLOSED'].includes(status))
        return problem(
          res,
          400,
          '지원하지 않는 DLT 메시지 상태입니다',
          '상태는 OPEN · REPROCESSED · CLOSED 중 하나로 보내 주세요.',
          req.url,
        )
      const rows = orderDeadLetters
        .filter((d) => d.status === status)
        .sort(
          (a, b) =>
            Number(b.paymentEvent) - Number(a.paymentEvent) ||
            Number(b.deadLetterId) - Number(a.deadLetterId),
        )
        .map(orderDeadLetterSummaryOf)
      return send(res, 200, pageFrom(rows, url.searchParams))
    }
    if ((x = r('GET', /^\/admin\/orders\/dead-letters\/(\d+)$/))) {
      const d = orderDeadLetters.find((d) => d.deadLetterId === x[1])
      return d ? send(res, 200, orderDeadLetterOf(d)) : orderDeadLetterNotFound(res, req)
    }
    if ((x = r('POST', /^\/admin\/orders\/dead-letters\/(\d+)\/reprocess$/))) {
      const d = orderDeadLetters.find((d) => d.deadLetterId === x[1])
      if (!d) return orderDeadLetterNotFound(res, req)
      if (d.status === 'CLOSED')
        return problem(
          res,
          409,
          '이미 종료된 DLT 메시지입니다',
          '확인 후 종료된 메시지라 재처리할 수 없습니다. DLT 메시지 목록을 새로고침해 주세요.',
          req.url,
        )
      if (d.status === 'OPEN') {
        const adminId = String(u.sub).slice('admin:'.length)
        Object.assign(d, {
          reprocessCount: d.reprocessCount + 1,
          lastReprocessedAt: now(),
          lastReprocessResult: d.failOnReplay ? 'IllegalStateException' : null,
          ...(d.failOnReplay
            ? {}
            : {
                status: 'REPROCESSED',
                handledBy: adminId,
                handledAt: now(),
                recommendedAction: null,
              }),
        })
      }
      return send(res, 200, orderDeadLetterOf(d))
    }
    if ((x = r('POST', /^\/admin\/orders\/dead-letters\/(\d+)\/close$/))) {
      const d = orderDeadLetters.find((d) => d.deadLetterId === x[1])
      if (!d) return orderDeadLetterNotFound(res, req)
      const memo = typeof body?.memo === 'string' ? body.memo : ''
      if (memo.trim() === '' || memo.length > 500)
        return problem(res, 400, '잘못된 요청입니다', 'memo: 1~500자로 입력해 주세요.', req.url)
      if (d.status === 'REPROCESSED')
        return problem(
          res,
          409,
          '이미 재처리된 DLT 메시지입니다',
          '재처리로 처리를 마친 메시지라 종료할 수 없습니다. DLT 메시지 목록을 새로고침해 주세요.',
          req.url,
        )
      if (d.status === 'OPEN')
        Object.assign(d, {
          status: 'CLOSED',
          handledBy: String(u.sub).slice('admin:'.length),
          handledAt: now(),
          memo,
          recommendedAction: null,
        })
      return send(res, 200, orderDeadLetterOf(d))
    }
    // 관리자 전체 주문 (BE #323) · 전체 결제 (BE #326): 최근 것부터
    if (r('GET', /^\/admin\/orders$/)) {
      if (!isAdmin(u))
        return problem(res, 403, '권한이 없습니다', '관리자만 볼 수 있습니다.', req.url)
      return send(
        res,
        200,
        page(
          orders
            .slice()
            .reverse()
            .map((o) => ({
              orderId: String(o.orderId),
              memberId: String(o.memberId),
              status: o.status,
              cancelReason: o.cancelReason,
              totalAmount: o.totalAmount,
              orderedAt: o.orderedAt,
              itemCount: o.items.length,
            })),
        ),
      )
    }
    // 결제 요약 (BE AdminPaymentController.getSummary #1220): 한국 날짜, 양 끝 포함, 비우면 오늘, 31일까지
    if (r('GET', /^\/admin\/payments\/summary$/)) {
      if (!isAdmin(u))
        return problem(res, 403, '권한이 없습니다', '관리자만 볼 수 있습니다.', req.url)
      const to = url.searchParams.get('to') || now().slice(0, 10)
      const from = url.searchParams.get('from') || to
      const days = (Date.parse(to) - Date.parse(from)) / 86400e3 + 1
      if (!(days >= 1 && days <= 31))
        return problem(
          res,
          400,
          '조회할 수 없는 기간입니다',
          '시작일은 종료일보다 늦을 수 없고, 한 번에 31일까지 조회할 수 있습니다.',
          req.url,
        )
      const daily = Array.from({ length: days }, (_, i) => {
        const date = new Date(Date.parse(from) + i * 86400e3).toISOString().slice(0, 10)
        const paid = payments.filter((p) => p.status !== 'FAILED' && p.paidAt?.startsWith(date))
        return {
          date,
          paidAmount: paid.reduce((sum, p) => sum + p.amount, 0),
          paidCount: paid.length,
        }
      })
      const refundedPaymentCount = payments.filter((p) =>
        ['PARTIALLY_REFUNDED', 'REFUNDED'].includes(p.status),
      ).length
      return send(res, 200, { daily, refundedPaymentCount })
    }
    if (r('GET', /^\/admin\/payments$/)) {
      if (!isAdmin(u))
        return problem(res, 403, '권한이 없습니다', '관리자만 볼 수 있습니다.', req.url)
      return send(
        res,
        200,
        page(
          payments
            .slice()
            .reverse()
            .map(({ items: _i, ...x }) => x),
        ),
      )
    }
    // 사이즈 추천 (BE #262 · #681). 규칙은 단순화: 키가 권장 키 ±2cm 안이면 후보, 둘 이상이면 체형 · 선호 핏으로 고름
    if (r('GET', /^\/recommendations\/size$/)) {
      const productId = url.searchParams.get('productId')
      const childId = url.searchParams.get('childId')
      if (!productId || !childId)
        return problem(res, 400, '잘못된 요청입니다', 'productId · childId는 필수입니다.', req.url)
      const detail = productDetailOf(productId)
      if (!detail || detail.status !== 'ON_SALE')
        return problem(res, 404, '상품을 찾을 수 없습니다', '상품을 찾을 수 없습니다.', req.url)
      const c = children.find((c) => c.id === +childId && c.memberId === me && !c.deleted)
      if (!c)
        return problem(res, 404, '자녀를 찾을 수 없습니다', '자녀를 찾을 수 없습니다.', req.url)
      // AI 흉내: 상품 ID가 홀수이고 추천 사이즈가 있으면 AI 근거 두 개, 아니면 RULE(근거 [])
      const rec = sizeRecommendationOf(detail, c)
      const isAi = Number(productId) % 2 === 1 && rec.recommendedSize !== null
      // 기준 핏 (BE #1261): 자녀의 같은 칸 기준 옷과 비교. AI 답이면 추천 사이즈의 항목별 판단도
      const referenceFit = detail.sizeFree
        ? null
        : referenceFitOf(c.id, detail.categoryId, detail.sizeSpecs)
      return send(res, 200, {
        ...rec,
        referenceFit,
        itemJudgements: isAi ? itemJudgementsOf(referenceFit, rec.recommendedSize) : [],
        source: isAi ? 'AI' : 'RULE',
        reasons: isAi
          ? [
              {
                type: 'HEIGHT',
                detail: `키 ${c.heightCm}cm에 ${rec.recommendedSize}이 잘 맞아요.`,
                sourceId: null,
              },
              { type: 'RULE_RESULT', detail: '키 기준표 계산과 같은 사이즈예요.', sourceId: null },
            ]
          : [],
      })
    }
    if (r('POST', /^\/seller\/product-images\/upload-urls$/)) {
      if (!(u.roles || []).includes('SELLER'))
        return problem(res, 403, '권한이 없습니다', '판매자만 올릴 수 있습니다.', req.url)
      const result = issueImageUploadUrls(me, body)
      return result.status === 200
        ? send(res, 200, result.body)
        : problem(res, result.status, '잘못된 요청입니다', result.detail, req.url)
    }
    if (r('POST', /^\/seller\/products$/)) {
      const result = register(me, body)
      return result.status === 201
        ? send(res, 201, result.body, { location: result.location })
        : problem(res, result.status, '요청을 처리할 수 없습니다', result.detail, req.url)
    }
    if ((x = r('PUT', /^\/seller\/products\/(\d+)$/))) {
      const result = updateProduct(me, x[1], body)
      return result.status === 200
        ? send(res, 200, result.body)
        : problem(res, result.status, '요청을 처리할 수 없습니다', result.detail, req.url)
    }
    if ((x = r('PUT', /^\/seller\/products\/(\d+)\/sale-status$/))) {
      const result = changeSaleStatus(me, x[1], body)
      return result.status === 200
        ? send(res, 200, result.body)
        : problem(res, result.status, '요청을 처리할 수 없습니다', result.detail, req.url)
    }
    if ((x = r('PUT', /^\/seller\/products\/(\d+)\/delisting$/))) {
      const result = delist(me, x[1])
      return result.status === 200
        ? send(res, 200, result.body)
        : problem(res, result.status, '요청을 처리할 수 없습니다', result.detail, req.url)
    }
    if (r('GET', /^\/seller\/products$/)) {
      const status = url.searchParams.get('status')
      if (status && !['SALE_PENDING', 'ON_SALE', 'STOPPED', 'DELISTED'].includes(status))
        return problem(
          res,
          400,
          '잘못된 요청입니다',
          'status: 판매 상태는 SALE_PENDING · ON_SALE · STOPPED · DELISTED 중 하나입니다.',
          req.url,
        )
      const lowStock = url.searchParams.get('lowStock') === 'true'
      return send(res, 200, pageFrom(sellerListOf(me, { status, lowStock }), url.searchParams))
    }
    if ((x = r('GET', /^\/seller\/products\/(\d+)$/))) {
      const detail = sellerDetailOf(me, x[1])
      return detail
        ? send(res, 200, detail)
        : problem(res, 404, '찾을 수 없습니다', '상품을 찾을 수 없습니다.', req.url)
    }
    if ((x = r('POST', /^\/seller\/options\/(\d+)\/inventory-adjustments$/))) {
      const result = adjustInventory(me, x[1], body)
      return result.status === 200
        ? send(res, 200, result.body)
        : problem(res, result.status, '요청을 처리할 수 없습니다', result.detail, req.url)
    }
    if ((x = r('PUT', /^\/admin\/products\/(\d+)\/sale-status$/))) {
      if (!isAdmin(u))
        return problem(res, 403, '권한이 없습니다', '관리자만 할 수 있습니다.', req.url)
      const result = adminChangeSaleStatus(x[1], body)
      return result.status === 200
        ? send(res, 200, result.body)
        : problem(res, result.status, '요청을 처리할 수 없습니다', result.detail, req.url)
    }
    if ((x = r('DELETE', /^\/admin\/products\/(\d+)\/delisting$/))) {
      if (!isAdmin(u))
        return problem(res, 403, '권한이 없습니다', '관리자만 할 수 있습니다.', req.url)
      const result = adminRevertDelist(x[1])
      return result.status === 200
        ? send(res, 200, result.body)
        : problem(res, result.status, '요청을 처리할 수 없습니다', result.detail, req.url)
    }
    // 관리자 상품 기준 데이터 (catalog.mjs)
    const catalog = catalogRoute(m, p, body)
    if (catalog) {
      if (!isAdmin(u))
        return problem(res, 403, '권한이 없습니다', '관리자만 할 수 있습니다.', req.url)
      const result = catalog()
      return result.body || result.status === 204
        ? send(res, result.status, result.body)
        : problem(res, result.status, '요청을 처리할 수 없습니다', result.detail, req.url)
    }
    if (r('GET', /^\/members\/me$/))
      return problem(res, 404, '찾을 수 없습니다', '회원을 찾을 수 없습니다.', req.url)
    if (r('GET', /^\/children$/))
      return send(res, 200, children.filter((c) => c.memberId === me && !c.deleted).map(childOf))
    if ((x = r('GET', /^\/children\/(\d+)$/))) {
      const c = children.find((c) => c.id === +x[1] && c.memberId === me && !c.deleted)
      return c
        ? send(res, 200, childOf(c))
        : problem(res, 404, '찾을 수 없습니다', '자녀 없음', req.url)
    }
    if ((x = r('PATCH', /^\/children\/(\d+)$/))) {
      const c = children.find((c) => c.id === +x[1] && c.memberId === me && !c.deleted)
      if (!c) return problem(res, 404, '찾을 수 없습니다', '자녀 없음', req.url)
      if (!c.hasOptionalConsent && (body.bodyType != null || body.preferredFit != null))
        return problem(res, 400, '선택 동의가 필요합니다', '선택 동의가 필요합니다', req.url)
      // 키 · 체형이 바뀌면 성장 이력 1건 (기획서 2.1)
      if (c.heightCm !== body.heightCm || c.bodyType !== body.bodyType)
        c.growth.push({
          id: nid(),
          heightCm: body.heightCm,
          bodyType: body.bodyType,
          recordedAt: now(),
        })
      Object.assign(c, body, {
        growthRecordCount: c.growth.length,
        lastRecordedAt: c.growth.at(-1).recordedAt,
      })
      return send(res, 200, childOf(c))
    }
    if ((x = r('DELETE', /^\/children\/(\d+)$/))) {
      const c = children.find((c) => c.id === +x[1] && c.memberId === me && !c.deleted)
      if (!c) return problem(res, 404, '찾을 수 없습니다', '자녀 없음', req.url)
      c.deleted = true
      return send(res, 204)
    }
    if ((x = r('GET', /^\/children\/(\d+)\/growth-records$/))) {
      const c = children.find((c) => c.id === +x[1] && c.memberId === me && !c.deleted)
      if (!c) return problem(res, 404, '찾을 수 없습니다', '자녀 없음', req.url)
      return send(res, 200, c.growth)
    }
    if (r('PATCH', /^\/members\/me$/))
      return send(res, 200, {
        id: me,
        nickname: body.nickname.trim(),
        roles: u.roles,
        sellerStatus: null,
        providers: [],
      })
    if ((x = r('PATCH', /^\/members\/me\/addresses\/(\d+)$/))) {
      const a = addresses.find((a) => a.id === +x[1])
      if (!a) return problem(res, 404, '찾을 수 없습니다', '배송지 없음', req.url)
      if (body.isDefault) addresses.forEach((o) => (o.isDefault = false))
      Object.assign(a, body, { isDefault: body.isDefault || a.isDefault })
      return send(res, 200, a)
    }
    if (r('POST', /^\/children$/)) {
      if (!verifications[me])
        return problem(res, 403, '본인인증이 필요합니다', '본인인증이 필요합니다', req.url)
      if (body.requiredConsent !== true || typeof body.optionalConsent !== 'boolean')
        return problem(res, 400, '잘못된 요청', '동의가 필요합니다', req.url)
      if (!body.optionalConsent && (body.bodyType != null || body.preferredFit != null))
        return problem(res, 400, '선택 동의가 필요합니다', '선택 동의가 필요합니다', req.url)
      const today = new Date()
      const [year, month, day] = body.birthDate.split('-').map(Number)
      const age =
        today.getFullYear() -
        year -
        (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)
          ? 1
          : 0)
      if (age >= 14)
        return problem(res, 400, '등록할 수 없는 나이입니다', '등록할 수 없는 나이입니다', req.url)
      const { requiredConsent, optionalConsent, ...profile } = body
      const t = now()
      const growth = [
        { id: nid(), heightCm: body.heightCm, bodyType: body.bodyType, recordedAt: t },
      ]
      const c = {
        id: nid(),
        memberId: me,
        ...profile,
        hasOptionalConsent: optionalConsent,
        growth,
        growthRecordCount: 1,
        lastRecordedAt: t,
      }
      children.push(c)
      return send(res, 201, childOf(c))
    }
    if (r('GET', /^\/members\/me\/addresses$/)) return send(res, 200, addresses)
    if (r('POST', /^\/members\/me\/addresses$/)) {
      if (body.isDefault) addresses.forEach((a) => (a.isDefault = false))
      const a = { id: nid(), ...body, isDefault: body.isDefault || addresses.length === 0 }
      addresses.push(a)
      return send(res, 201, a)
    }
    if (r('POST', /^\/wallets\/me\/charges\/confirm$/)) {
      // BE: 대기 중이 아닌 충전(이미 승인 · 실패 · 만료)은 409 INVALID_CHARGE_STATUS
      if (charges.some((c) => c.orderId === body.orderId))
        return problem(res, 409, 'Conflict', '처리할 수 없는 충전 상태입니다.', req.url)
      wallets[me] = (wallets[me] ?? 0) + body.amount
      charges.push({
        chargeId: 77,
        memberId: me,
        orderId: body.orderId,
        amount: body.amount,
        status: 'DONE',
        approvedAt: now(),
        expiresAt: now(),
        createdAt: now(),
      })
      ledger(me, 'CHARGE', body.amount, 77)
      return send(res, 200, {
        chargeId: 77,
        status: 'DONE',
        amount: body.amount,
        balance: wallets[me],
      })
    }
    if (r('POST', /^\/wallets\/me\/charges\/fail$/)) {
      // BE ChargeDetailResponse: 결제창이 끝나지 않은 충전을 FAILED로
      return send(res, 200, {
        chargeId: 78,
        orderId: body.orderId,
        amount: 50000,
        status: 'FAILED',
        approvedAt: null,
        expiresAt: now(),
        createdAt: now(),
      })
    }
    if ((x = r('POST', /^\/wallets\/me\/charges\/(\d+)\/cancel$/))) {
      // BE ChargeCancelResponse: 끝나면 200 CANCELLED + 취소 후 잔액
      const c = charges.find(
        (c) => c.chargeId === +x[1] && c.memberId === me && c.status === 'DONE',
      )
      if (!c) return problem(res, 409, 'Conflict', '취소할 수 없는 충전이에요.')
      c.status = 'CANCELLED'
      wallets[me] = (wallets[me] ?? 0) - c.amount
      ledger(me, 'CHARGE_CANCEL', -c.amount, c.chargeId)
      return send(res, 200, {
        chargeId: c.chargeId,
        status: 'CANCELLED',
        amount: c.amount,
        balance: wallets[me],
      })
    }
    if (r('GET', /^\/wallets\/me\/charges$/))
      return send(
        res,
        200,
        page(
          charges
            .filter((c) => c.memberId === me)
            .slice()
            .reverse()
            .map(({ memberId: _m, ...c }) => c),
        ),
      )
    if ((x = r('GET', /^\/wallets\/me\/charges\/(\d+)$/)))
      return send(res, 200, {
        chargeId: +x[1],
        orderId: 'toss-' + x[1],
        amount: 50000,
        status: 'DONE',
        approvedAt: now(),
        expiresAt: now(),
        createdAt: now(),
      })
    if (r('GET', /^\/wallets\/me\/ledgers$/))
      return send(
        res,
        200,
        page(
          ledgers
            .filter((l) => l.memberId === me)
            .slice()
            .reverse()
            .map(({ memberId: _m, ...l }) => l),
        ),
      )
    if (r('GET', /^\/payments$/))
      return send(
        res,
        200,
        page(
          payments
            .filter((x) => x.memberId === me)
            .slice()
            .reverse()
            .map(({ memberId: _m, items: _i, ...x }) => x),
        ),
      )
    if ((x = r('GET', /^\/payments\/(\d+)$/))) {
      const pm = payments.find((x2) => x2.paymentId === +x[1] && x2.memberId === me)
      if (!pm) return problem(res, 404, '찾을 수 없습니다', '결제를 찾을 수 없습니다.', req.url)
      const { memberId: _m, ...detail } = pm
      return send(res, 200, detail)
    }
    if (r('GET', /^\/wallets\/me$/)) return send(res, 200, { balance: wallets[me] ?? 0 })
    if (r('POST', /^\/orders$/)) {
      // 멱등키 (BE #351): 회원 + 키. 같은 내용이면 200 + 기존 주문, 다른 내용이면 409. 실패한 요청은 키를 남기지 않는다
      const idemKey = req.headers['idempotency-key']
      if (
        idemKey !== undefined &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idemKey)
      )
        return problem(res, 400, '잘못된 요청입니다', '요청 키는 UUID 형식이어야 합니다.', req.url)
      const idemSlot = idemKey ? `${me}:${idemKey.toLowerCase()}` : null
      const idemHash = JSON.stringify([
        [...body.items]
          .map((it) => [
            String(it.optionId),
            it.childId == null ? null : String(it.childId),
            it.quantity,
            it.unitPrice,
          ])
          .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
        body.shippingAddress,
      ])
      if (idemSlot && idempotency[idemSlot]) {
        const prev = idempotency[idemSlot]
        if (prev.hash !== idemHash)
          return problem(
            res,
            409,
            '이미 다른 주문에 쓴 요청입니다',
            '주문서를 다시 열어 주문해 주세요.',
            req.url,
          )
        return send(res, 200, detailOf(orders.find((o) => o.orderId === prev.orderId)))
      }
      // 칸으로 사는 줄 (BE OrderCartLines.requireOrderable): 내 칸이거나 내가 승인자인 예약 칸, 옵션 · 자녀가 같고 예약 칸은 수량 ≤ 칸 수량
      for (const it of body.items) {
        if (it.cartItemId == null) continue
        const l = cart.find((line) => line.cartItemId === String(it.cartItemId))
        if (!l) return cartProblem(res, 'CART_ITEM_NOT_FOUND', req.url)
        const wish = wishOfLine(l)
        const isApprover =
          !!wish && children.some((c) => String(c.id) === wish.childId && c.memberId === me)
        if (
          (l.memberId !== me && !isApprover) ||
          l.optionId !== String(it.optionId) ||
          l.childId !== (it.childId == null ? null : String(it.childId))
        )
          return cartProblem(res, 'CART_ITEM_NOT_ORDERABLE', req.url)
        if (wish && it.quantity > l.quantity)
          return cartProblem(res, 'RESERVED_QUANTITY_EXCEEDED', req.url)
      }
      for (const it of body.items)
        if (replica[it.optionId].price !== it.unitPrice)
          return problem(
            res,
            409,
            '가격이 바뀌었습니다',
            '상품 가격이 바뀌었습니다. 다시 확인해 주세요.',
            req.url,
          )
      const items = body.items.map((it) => {
        const rp = replica[it.optionId]
        const ch = children.find((c) => c.id === it.childId)
        return {
          orderItemId: String(nid()),
          productId: String(rp.productId),
          optionId: String(it.optionId),
          sellerId: String(rp.sellerId),
          sellerName: '테스트상점',
          productName: rp.name,
          optionName: rp.optionName,
          size: rp.size,
          // 재고 차감 실패 때만 값 (BE 예정: OUT_OF_STOCK · PRODUCT_NOT_ON_SALE · OPTION_NOT_ON_SALE)
          unavailableReason: null,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          amount: it.unitPrice * it.quantity,
          status: 'ORDERED',
          deliveredAt: null,
          confirmedAt: null,
          confirmType: null,
          child: ch
            ? {
                childId: String(ch.id),
                name: ch.name,
                heightCm: ch.heightCm,
                weightKg: ch.weightKg,
                bodyType: ch.bodyType,
              }
            : null,
        }
      })
      const o = {
        orderId: nid(),
        memberId: me,
        status: 'PENDING_PAYMENT',
        cancelReason: null,
        totalAmount: items.reduce((s, i) => s + i.amount, 0),
        orderedAt: now(),
        paymentDueAt: later(stallNext?.timeoutMs ?? PAYMENT_TIMEOUT_MS),
        shippingAddress: body.shippingAddress,
        items,
        deliveries: [],
      }
      orders.push(o)
      recordHistory(
        o,
        'ORDER',
        o.orderId,
        null,
        'PENDING_PAYMENT',
        null,
        'BUYER',
        me,
        'POST /api/v1/orders',
      )
      orderCartLines.set(
        o,
        body.items
          .map((it, index) => ({ it, item: items[index] }))
          .filter(({ it }) => it.cartItemId != null)
          .map(({ it, item }) => ({
            cartItemId: String(it.cartItemId),
            quantity: it.quantity,
            orderItemId: item.orderItemId,
          })),
      )
      if (idemSlot) idempotency[idemSlot] = { hash: idemHash, orderId: o.orderId }
      const stall = stallNext
      stallNext = null
      scheduleOrder(o, me, stall)
      return send(res, 201, detailOf(o))
    }
    if (r('GET', /^\/orders$/))
      return send(
        res,
        200,
        page(
          orders
            .filter((o) => o.memberId === me)
            .map((o) => ({
              orderId: String(o.orderId),
              status: o.status,
              totalAmount: o.totalAmount,
              orderedAt: o.orderedAt,
              // 주문상품 ID가 가장 작은 주문상품의 상품명 · 주문상품 수 (BE #243)
              representativeProductName:
                [...o.items].sort((a, b) => Number(a.orderItemId) - Number(b.orderItemId))[0]
                  ?.productName ?? null,
              itemCount: o.items.length,
              sellerName: o.items[0]?.sellerName ?? null,
            })),
        ),
      )
    if ((x = r('GET', /^\/orders\/(\d+)$/)))
      return send(res, 200, detailOf(orders.find((o) => o.orderId === +x[1])))
    // BE OrderController GET /orders/{orderId}/timeline (#352): 본인 주문만, 아니면 404
    if ((x = r('GET', /^\/orders\/(\d+)\/timeline$/))) {
      const o = orders.find((each) => each.orderId === +x[1] && each.memberId === me)
      return o
        ? send(res, 200, orderTimelineOf(o))
        : problem(res, 404, '주문을 찾을 수 없습니다', '주문을 찾을 수 없습니다.', req.url)
    }
    // BE OrderService.cancelByBuyer (#354): 결제대기, 또는 모든 배송이 발송 전인 결제완료 주문만. 이미 취소면 그대로 200.
    // 결제완료면 남은 주문상품 금액을 돌려주고(REFUND) 재고를 되돌린다
    if ((x = r('POST', /^\/orders\/(\d+)\/cancel$/))) {
      const o = orders.find((each) => each.orderId === +x[1] && each.memberId === me)
      if (!o)
        return problem(res, 404, '주문을 찾을 수 없습니다', '주문을 찾을 수 없습니다.', req.url)
      if (o.status === 'CANCELLED') return send(res, 200, detailOf(o))
      if (o.deliveries.some((d) => d.status === 'SHIPPING' || d.status === 'DELIVERED'))
        return problem(
          res,
          409,
          '이미 발송된 상품이 있습니다',
          '판매자가 발송을 시작해 취소할 수 없습니다. 판매자에게 문의해 주세요.',
          req.url,
        )
      if (o.status === 'PAID') {
        const open = o.items.filter((it) => it.status === 'ORDERED')
        const refund = open.reduce((sum, it) => sum + it.amount, 0)
        open.forEach((it) => {
          it.status = 'CANCELLED'
          stock[it.optionId] = (stock[it.optionId] ?? 0) + it.quantity
        })
        o.deliveries.forEach((d) => (d.status = 'CANCELLED'))
        if (refund > 0) {
          wallets[me] = (wallets[me] ?? 0) + refund
          ledger(me, 'REFUND', refund, nid())
        }
      }
      recordHistory(
        o,
        'ORDER',
        o.orderId,
        o.status,
        'CANCELLED',
        'BUYER_CANCELLED',
        'BUYER',
        me,
        'POST /api/v1/orders/{orderId}/cancel',
      )
      o.status = 'CANCELLED'
      o.cancelReason = 'BUYER_CANCELLED'
      cancelledAt.set(o, now())
      return send(res, 200, detailOf(o))
    }
    if ((x = r('POST', /^\/orders\/(\d+)\/items\/(\d+)\/confirm$/))) {
      const it = orders.find((o) => o.orderId === +x[1]).items.find((i) => i.orderItemId === x[2])
      if (!it.deliveredAt)
        return problem(
          res,
          409,
          '배송 완료 전입니다',
          '배송이 완료된 뒤 구매확정할 수 있습니다.',
          req.url,
        )
      it.status = 'CONFIRMED'
      it.confirmedAt = now()
      it.confirmType = 'DIRECT'
      recordHistory(
        orders.find((o) => o.orderId === +x[1]),
        'ORDER_ITEM',
        it.orderItemId,
        'ORDERED',
        'CONFIRMED',
        null,
        'BUYER',
        me,
        'POST /api/v1/orders/{orderId}/items/{orderItemId}/confirm',
      )
      return send(res, 200, it)
    }
    const sellerOrders = () => orders.flatMap((o) => o.deliveries.map((d) => ({ d, o })))
    if (r('GET', /^\/seller\/orders$/))
      return send(
        res,
        200,
        page(
          sellerOrders().map(({ d, o }) => ({
            ...d,
            orderId: String(o.orderId),
            orderedAt: o.orderedAt,
            shippingAddress: o.shippingAddress,
            // BE: 판매 주문 목록의 sellerName은 늘 null, 자녀(child) 칸은 없다 (BE #997)
            items: o.items.map(({ child: _child, ...it }) => ({ ...it, sellerName: null })),
            deliveredAt: d.deliveredAt,
          })),
        ),
      )
    if ((x = r('POST', /^\/seller\/orders\/(\d+)\/ship$/))) {
      const { d, o } = sellerOrders().find(({ d }) => d.sellerOrderId === x[1])
      // BE ShipRequest · OrderErrorCode: 택배사는 코드만(대문자 정확히), 송장 1~50자, 발송은 한 번
      if (!['CJ', 'EPOST', 'HANJIN', 'LOTTE', 'LOGEN', 'DUMMY'].includes(body?.carrier))
        return problem(
          res,
          400,
          '지원하지 않는 택배사입니다',
          '지원하는 택배사는 CJ · EPOST · HANJIN · LOTTE · LOGEN입니다.',
          req.url,
        )
      const tracking = String(body?.trackingNumber ?? '')
      if (!tracking.trim() || tracking.length > 50)
        return problem(res, 400, '잘못된 요청입니다', '송장번호를 1~50자로 넣어 주세요.', req.url)
      if (d.status !== 'READY')
        return problem(
          res,
          409,
          '이미 발송된 주문입니다',
          '이미 발송된 주문입니다. 판매 주문 목록을 새로고침해 주세요.',
          req.url,
        )
      Object.assign(d, {
        status: 'SHIPPING',
        carrier: body.carrier,
        trackingNumber: body.trackingNumber,
        shippedAt: now(),
      })
      recordHistory(
        o,
        'DELIVERY',
        d.sellerOrderId,
        'READY',
        'SHIPPING',
        null,
        'SELLER',
        me,
        'POST /api/v1/seller/orders/{sellerOrderId}/ship',
      )
      return send(res, 200, { ...d, orderId: String(o.orderId) })
    }
    // BE DeliveryService.cancel (#655): 발송 준비일 때만 내 몫 주문상품을 모두 취소하고 결제가 그 금액을 돌려준다.
    // 모든 주문상품이 취소되면 주문도 취소(SELLER_CANCELLED). 사유는 판매자 사유 3가지만
    if ((x = r('POST', /^\/seller\/orders\/(\d+)\/cancel$/))) {
      const found = sellerOrders().find(({ d }) => d.sellerOrderId === x[1])
      if (!found)
        return problem(
          res,
          404,
          '판매 주문을 찾을 수 없습니다',
          '판매 주문을 찾을 수 없습니다.',
          req.url,
        )
      const { d, o } = found
      if (!['OUT_OF_STOCK', 'WRONG_PRODUCT_INFO', 'OTHER'].includes(body?.reason))
        return problem(
          res,
          400,
          '지원하지 않는 취소 사유입니다',
          '취소 사유는 OUT_OF_STOCK · WRONG_PRODUCT_INFO · OTHER 중 하나입니다.',
          req.url,
        )
      if (d.status === 'CANCELLED')
        return problem(
          res,
          409,
          '이미 취소된 판매 주문입니다',
          '이미 취소된 판매 주문입니다. 판매 주문 목록을 새로고침해 주세요.',
          req.url,
        )
      if (d.status !== 'READY')
        return problem(
          res,
          409,
          '이미 발송된 주문입니다',
          '이미 발송된 주문입니다. 판매 주문 목록을 새로고침해 주세요.',
          req.url,
        )
      d.status = 'CANCELLED'
      recordHistory(
        o,
        'DELIVERY',
        d.sellerOrderId,
        'READY',
        'CANCELLED',
        body.reason,
        'SELLER',
        me,
        'POST /api/v1/seller/orders/{sellerOrderId}/cancel',
      )
      const mine = o.items.filter((it) => it.sellerId === d.sellerId && it.status === 'ORDERED')
      mine.forEach((it) => (it.status = 'CANCELLED'))
      const refund = mine.reduce((sum, it) => sum + it.amount, 0)
      if (refund > 0) {
        wallets[o.memberId] = (wallets[o.memberId] ?? 0) + refund
        ledger(o.memberId, 'REFUND', refund, nid())
      }
      if (o.items.every((it) => it.status === 'CANCELLED')) {
        o.status = 'CANCELLED'
        o.cancelReason = 'SELLER_CANCELLED'
        cancelledAt.set(o, now())
        recordHistory(
          o,
          'ORDER',
          o.orderId,
          'PAID',
          'CANCELLED',
          'SELLER_CANCELLED',
          'SELLER',
          me,
          'POST /api/v1/seller/orders/{sellerOrderId}/cancel',
        )
      }
      return send(res, 200, { ...d, orderId: String(o.orderId) })
    }
    if ((x = r('POST', /^\/seller\/orders\/(\d+)\/deliver$/))) {
      const { d, o } = sellerOrders().find(({ d }) => d.sellerOrderId === x[1])
      Object.assign(d, { status: 'DELIVERED', deliveredAt: now() })
      recordHistory(
        o,
        'DELIVERY',
        d.sellerOrderId,
        'SHIPPING',
        'DELIVERED',
        null,
        'SELLER',
        me,
        'POST /api/v1/seller/orders/{sellerOrderId}/deliver',
      )
      o.items.forEach((i) => (i.deliveredAt = now()))
      return send(res, 200, { ...d, orderId: String(o.orderId) })
    }
    if (r('GET', /^\/members\/me\/seller-application$/)) {
      // 백엔드: 가장 최근 신청
      const a = apps.findLast((a) => a.applicantId === me)
      return a
        ? send(res, 200, myAppOf(a))
        : problem(res, 404, '찾을 수 없습니다', '신청 없음', req.url)
    }
    if (r('POST', /^\/members\/me\/seller-application$/)) {
      const a = {
        id: nid(),
        applicantId: me,
        applicantNickname: u.nickname,
        ...body,
        maskedBusinessRegistrationNumber: '123-45-*****',
        status: 'PENDING',
        createdAt: now(),
        decidedAt: null,
        rejectReason: null,
      }
      apps.push(a)
      return send(res, 201, myAppOf(a))
    }
    if (
      (x = r('GET', /^\/admin\/(auth-|member-|seller-|child-profile-|community\/)dead-letters$/))
    ) {
      const status = url.searchParams.get('status') ?? 'OPEN'
      // BE @Pattern(OPEN|REPROCESSED)
      if (!['OPEN', 'REPROCESSED'].includes(status))
        return problem(res, 400, '잘못된 요청입니다', '요청 값을 확인해 주세요.', req.url)
      const rows = deadLetters
        .filter((d) => d.module === dltModule(x[1]) && d.status === status)
        .sort((a, b) => Number(b.deadLetterId) - Number(a.deadLetterId))
        .map(deadLetterOf)
      return send(res, 200, pageFrom(rows, url.searchParams))
    }
    if (
      (x = r(
        'GET',
        /^\/admin\/(auth-|member-|seller-|child-profile-|community\/)dead-letters\/(\d+)$/,
      ))
    ) {
      const d = deadLetters.find((d) => d.module === dltModule(x[1]) && d.deadLetterId === x[2])
      return d
        ? send(res, 200, deadLetterOf(d))
        : problem(res, 404, '찾을 수 없습니다', '처리 실패 메시지를 찾을 수 없습니다.', req.url)
    }
    // BE {모듈}DeadLetterService.reprocess (커뮤니티 CommunityDeadLetterService 같음): 처리기가 다시 실패해도 200(OPEN, 횟수 · 실패 예외 기록), 이미 재처리 완료면 그대로 200
    if (
      (x = r(
        'POST',
        /^\/admin\/(auth-|member-|seller-|child-profile-|community\/)dead-letters\/(\d+)\/reprocess$/,
      ))
    ) {
      const d = deadLetters.find((d) => d.module === dltModule(x[1]) && d.deadLetterId === x[2])
      if (!d)
        return problem(
          res,
          404,
          '찾을 수 없습니다',
          '처리 실패 메시지를 찾을 수 없습니다.',
          req.url,
        )
      if (d.status === 'OPEN') {
        Object.assign(d, {
          replayCount: d.replayCount + 1,
          lastReplayedBy: String(u.sub).slice('admin:'.length),
          lastReplayedAt: now(),
          lastReplayFailureType: d.failOnReplay ? 'java.lang.IllegalStateException' : null,
          status: d.failOnReplay ? 'OPEN' : 'REPROCESSED',
        })
      }
      return send(res, 200, deadLetterOf(d))
    }
    if (r('GET', /^\/admin\/members$/)) {
      const filter = url.searchParams.get('filter') || 'ALL'
      // BE AdminMemberFilter. ADMIN은 BE #762에서 빠져 400
      if (!['ALL', 'BUYER', 'SELLER', 'SUSPENDED'].includes(filter))
        return problem(res, 400, '잘못된 요청입니다', '요청 값을 확인해 주세요.', req.url)
      const keyword = (url.searchParams.get('keyword') || '').trim()
      const rows = Object.entries(members)
        .map(([id, m]) => ({ id: +id, ...m, createdAt: '2026-10-01T10:00:00' }))
        .filter((m) =>
          filter === 'SUSPENDED'
            ? m.status === 'SUSPENDED'
            : filter === 'SELLER'
              ? m.sellerStatus !== null
              : filter === 'BUYER'
                ? m.sellerStatus === null
                : true,
        )
        .filter((m) => !keyword || String(m.id) === keyword || m.nickname.includes(keyword))
      return send(res, 200, page(rows))
    }
    if ((x = r('POST', /^\/admin\/members\/(\d+)\/suspend$/))) {
      const m = members[x[1]]
      if (!m || m.status !== 'ACTIVE')
        return problem(
          res,
          409,
          '정지할 수 없는 회원입니다',
          '이미 정지 · 탈퇴한 회원입니다.',
          req.url,
        )
      Object.assign(m, { status: 'SUSPENDED', suspendReason: body.reason, suspendedAt: now() })
      return send(res, 204)
    }
    if ((x = r('POST', /^\/admin\/sellers\/(\d+)\/suspend$/))) {
      const m = members[x[1]]
      if (!m || m.sellerStatus !== 'ACTIVE')
        return problem(
          res,
          409,
          '이미 정지된 판매자입니다',
          '자격이 이미 정지된 판매자입니다.',
          req.url,
        )
      m.sellerStatus = 'SUSPENDED'
      return send(res, 200, { sellerId: +x[1], businessName: m.nickname, status: 'SUSPENDED' })
    }
    if (r('GET', /^\/admin\/seller-applications$/)) {
      const status = url.searchParams.get('status')
      const content = apps
        .filter((application) => !status || application.status === status)
        .sort((a, b) => b.id - a.id)
        .map(appSummaryOf)
      return send(res, 200, pageFrom(content, url.searchParams))
    }
    if ((x = r('POST', /^\/admin\/seller-applications\/(\d+)\/reject$/))) {
      const a = apps.find((a) => a.id === +x[1])
      if (a.status !== 'PENDING')
        return problem(
          res,
          409,
          '심사 중인 신청이 아닙니다',
          '이미 처리된 판매자 신청입니다.',
          req.url,
        )
      if (!body?.reason?.trim() || body.reason.length > 200)
        return problem(res, 400, '잘못된 요청입니다', '거절 사유를 확인해 주세요.', req.url)
      Object.assign(a, { status: 'REJECTED', rejectReason: body.reason, decidedAt: now() })
      return send(res, 200, appSummaryOf(a))
    }
    if (r('GET', /^\/seller\/me$/)) {
      if (!(u.roles || []).includes('SELLER'))
        return problem(res, 403, '권한이 없습니다', '판매자만 볼 수 있습니다.', req.url)
      return send(res, 200, {
        sellerId: me,
        businessName: u.nickname || '테스트상점',
        status: 'ACTIVE',
      })
    }
    if ((x = r('POST', /^\/admin\/seller-applications\/(\d+)\/approve$/))) {
      const a = apps.find((a) => a.id === +x[1])
      a.status = 'APPROVED'
      return send(res, 200, appSummaryOf(a))
    }
    problem(res, 404, '찾을 수 없습니다', `없는 API ${m} ${p}`, req.url)
  })
  .listen(PORT, () => console.log(`가짜 백엔드 http://localhost:${PORT}`))
