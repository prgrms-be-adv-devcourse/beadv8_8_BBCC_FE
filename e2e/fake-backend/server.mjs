// E2E 전용 가짜 백엔드 (실제 백엔드 코드와 무관). 구현된 API의 응답 모양(DTO)만 흉내 낸다.
// 상품은 등록 · 판매 시작 · 상세 · 카테고리 · 이미지 업로드 주소 발급만 있다(products.mjs). 판매자 상품 목록 · 상세 · 재고 조정 · 판매 중지도 products.mjs. 상품 목록 · 사이즈 추천 · 자녀 맞춤 목록 · 관리자 전체 주문 · 결제 · 정산은 여기서 응답하고, 상품 수정은 FE 목(app/mocks)이 응답한다.
// 응답 모양이 실제와 달라지면 FE 흐름 패널의 계약 검사로 드러난다.
import http from 'node:http'
import {
  categoryInputs,
  categoryTree,
  listOf as productListOf,
  adjustInventory,
  adminChangeSaleStatus,
  changeSaleStatus,
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

const PORT = Number(process.env.PORT ?? 18080)
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
let id = 1
const nid = () => id++
const childAccounts = []
const wishItems = [],
  wishRequests = []
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
const wallets = { 1: 100000, 2: 0, 3: 0 }
// 주문 멱등키 (BE #351): '회원:키' → { hash, orderId }
const idempotency = {}
// BE WalletLedger: 잔액이 바뀔 때마다 한 줄 (출금은 음수)
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
const later = (ms) => new Date(Date.now() + 9 * 3600e3 + ms).toISOString().slice(0, 19)
// 결제 마감 (BE kidly.order.payment-timeout, 기본 10분)
const PAYMENT_TIMEOUT_MS = 10 * 60e3
// 다음 주문 하나를 처리하지 않고 결제 마감에 취소한다 (상품 order.created 리스너가 없는 실제 백엔드 흉내).
// POST /__fake/payment-stall { timeoutMs } — 가짜 백엔드 전용
let stallNext = null
const problem = (res, status, title, detail, instance) =>
  send(res, status, { type: 'about:blank', title, status, detail, instance })
// BE WishErrorCode와 같은 상태 · title · detail
const WISH_ERROR = {
  INVALID_QUANTITY: [400, '잘못된 수량입니다', '수량은 1 이상 99 이하여야 합니다.'],
  PRODUCT_NOT_PURCHASABLE: [
    409,
    '구매할 수 없는 상품입니다',
    '판매가 중지됐거나 품절된 상품이 있습니다. 장바구니에서 빼고 다시 주문해 주세요.',
  ],
  PRODUCT_OPTION_NOT_FOUND: [
    404,
    '상품 옵션을 찾을 수 없습니다',
    '없는 상품 옵션입니다. 상품 화면에서 옵션을 다시 골라 주세요.',
  ],
  CHILD_NOT_FOUND: [404, '자녀를 찾을 수 없습니다', '없는 자녀입니다. 자녀를 다시 선택해 주세요.'],
  WISH_ITEM_NOT_FOUND: [
    404,
    '조르기 상품을 찾을 수 없습니다',
    '이미 조르기에서 빠진 상품입니다. 목록을 새로고침해 주세요.',
  ],
  WISH_ITEM_REMOVE_FORBIDDEN: [
    403,
    '이 상품은 뺄 수 없습니다',
    '다른 사람이 담은 상품은 뺄 수 없습니다.',
  ],
  WISH_ITEM_IN_REQUEST: [
    409,
    '조르는 중인 상품입니다',
    '진행 중인 조르기에 든 상품은 다른 조르기에 넣거나 수량을 바꾸거나 뺄 수 없습니다.',
  ],
  INVALID_WISH_REQUEST: [
    400,
    '잘못된 조르기입니다',
    '조를 상품을 하나 이상 겹치지 않게 고르고, 메시지는 정해진 길이 안으로 적어 주세요.',
  ],
  WISH_REQUEST_NOT_FOUND: [
    404,
    '조르기를 찾을 수 없습니다',
    '없는 조르기입니다. 목록을 새로고침해 주세요.',
  ],
  WISH_REQUEST_ALREADY_DECIDED: [
    409,
    '이미 처리한 조르기입니다',
    '이미 승인했거나 거절한 조르기입니다. 목록을 새로고침해 주세요.',
  ],
  INVALID_APPROVAL: [
    400,
    '잘못된 승인입니다',
    '조르기에 든 상품을 하나 이상 겹치지 않게 골라 주세요. 바로 결제는 상품마다 가격과 배송지가 필요합니다.',
  ],
  INVALID_REJECT_REASON: [400, '잘못된 거절 사유입니다', '거절 사유를 목록에서 골라 주세요.'],
}
const wishProblem = (res, code, instance) => problem(res, ...WISH_ERROR[code], instance)
const WISH_REJECT_REASONS = ['TOO_EXPENSIVE', 'ALREADY_HAVE', 'NEXT_TIME', 'OTHER']
// 주문이 취소된 시각 (주문 상세 응답에는 없는 값이라 따로 둔다)
const cancelledAt = new WeakMap()
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

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'content-type': status >= 400 ? 'application/problem+json' : 'application/json',
    ...headers,
  })
  res.end(body === undefined ? '' : JSON.stringify(body))
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
function scheduleOrder(o, me, stall, clearCart = true) {
  // 결제 마감: 그때까지 결제 처리 중이면 PAYMENT_EXPIRED로 취소 (BE 마감 스케줄러)
  setTimeout(() => {
    if (o.status !== 'PENDING_PAYMENT') return
    o.status = 'CANCELLED'
    o.cancelReason = 'PAYMENT_EXPIRED'
    cancelledAt.set(o, now())
  }, stall?.timeoutMs ?? PAYMENT_TIMEOUT_MS).unref()
  if (!stall)
    setTimeout(() => {
      // 상품: 하나라도 부족하면 아무것도 차감하지 않고 주문 취소 (기획서 4장).
      // 장바구니는 그대로 남는다 (BE: 결제 완료 뒤 주문한 줄만 빠진다)
      const short = o.items.filter((it) => (stock[it.optionId] ?? 0) < it.quantity)
      if (short.length > 0) {
        o.status = 'CANCELLED'
        o.cancelReason = 'OUT_OF_STOCK'
        cancelledAt.set(o, now())
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
      // 결제 완료 → 주문한 옵션의 장바구니 줄만 뺀다
      const ordered = new Set(o.items.map((it) => String(it.optionId)))
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
const childOf = ({ memberId: _m, deleted: _d, growth: _g, ...c }) => c
const lineOf = ({ memberId: _m, ...l }) => ({ ...l, lineAmount: l.unitPrice * l.quantity })
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
    if (r('GET', /^\/categories$/)) return send(res, 200, categoryTree)
    if ((x = r('GET', /^\/categories\/(\d+)\/attributes$/))) {
      const inputs = categoryInputs(+x[1])
      return inputs
        ? send(res, 200, inputs)
        : problem(res, 404, '찾을 수 없습니다', '카테고리를 찾을 수 없습니다.', req.url)
    }
    if (r('GET', /^\/products$/))
      return send(res, 200, pageFrom(productListOf(url.searchParams), url.searchParams))
    if ((x = r('GET', /^\/products\/(\d+)$/))) {
      const detail = productDetailOf(x[1])
      return detail
        ? send(res, 200, detail)
        : problem(res, 404, '찾을 수 없습니다', '상품을 찾을 수 없습니다.', req.url)
    }
    if (!u) return problem(res, 401, '로그인이 필요합니다', '로그인이 필요합니다.', req.url)
    // BE #755 Gateway: 관리자 API는 관리자 토큰만, 회원 토큰은 ADMIN 역할이 있어도 403
    if (p.startsWith('/admin/') && !isAdmin(u))
      return problem(res, 403, '권한이 없습니다', '관리자만 할 수 있습니다.', req.url)
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
      if (r('GET', /^\/child\/wish$/)) {
        const childId = String(account.childProfileId)
        const items = wishItems.filter((item) => item.childId === childId).reverse()
        return send(res, 200, {
          childId,
          items,
          totalAmount: items.reduce((sum, item) => sum + item.lineAmount, 0),
        })
      }
      if (r('POST', /^\/child\/wish\/items$/)) {
        if (!profile) return wishProblem(res, 'CHILD_NOT_FOUND', req.url)
        if (badQuantity(body.quantity)) return wishProblem(res, 'INVALID_QUANTITY', req.url)
        const rp = replica[body.optionId]
        if (!rp) return wishProblem(res, 'PRODUCT_OPTION_NOT_FOUND', req.url)
        const childId = String(profile.id)
        const existing = wishItems.find(
          (item) => item.childId === childId && item.optionId === String(body.optionId),
        )
        if (existing) {
          if (existing.requestId) return wishProblem(res, 'WISH_ITEM_IN_REQUEST', req.url)
          if (badQuantity(existing.quantity + body.quantity))
            return wishProblem(res, 'INVALID_QUANTITY', req.url)
          existing.quantity += body.quantity
          existing.lineAmount = existing.quantity * existing.unitPrice
          return send(res, 200, existing)
        }
        const item = {
          wishItemId: String(nid()),
          childId,
          optionId: String(body.optionId),
          productId: String(rp.productId),
          sellerId: String(rp.sellerId),
          productName: rp.name,
          optionName: rp.optionName,
          size: rp.size,
          sellerName: '테스트상점',
          quantity: body.quantity,
          unitPrice: rp.price,
          purchasable: true,
          lineAmount: body.quantity * rp.price,
          addedBy: 'CHILD',
          addedAt: now(),
          saleStatus: 'ON_SALE',
          requestId: null,
        }
        wishItems.push(item)
        return send(res, 201, item)
      }
      if ((x = r('DELETE', /^\/child\/wish\/items\/(\d+)$/))) {
        const index = wishItems.findIndex(
          (item) => item.childId === String(account.childProfileId) && item.wishItemId === x[1],
        )
        if (index < 0) return wishProblem(res, 'WISH_ITEM_NOT_FOUND', req.url)
        if (wishItems[index].addedBy !== 'CHILD')
          return wishProblem(res, 'WISH_ITEM_REMOVE_FORBIDDEN', req.url)
        if (wishItems[index].requestId) return wishProblem(res, 'WISH_ITEM_IN_REQUEST', req.url)
        wishItems.splice(index, 1)
        return send(res, 204)
      }
      if (r('GET', /^\/child\/onboarding$/)) {
        // 프로필이 없으면 나이를 알 수 없으므로 보호자 동의가 필요한 쪽(14세 미만)으로 본다
        const birth = profile?.birthDate ?? new Date().toISOString().slice(0, 10)
        const today = new Date().toISOString().slice(0, 10)
        const age =
          Number(today.slice(0, 4)) -
          Number(birth.slice(0, 4)) -
          (today.slice(5) < birth.slice(5) ? 1 : 0)
        return send(res, 200, {
          ageGroup: age < 14 ? 'UNDER_14' : 'OVER_14',
          noticeConfirmed: !!account.noticeConfirmed,
          consented: !!account.consented,
          hasProfile: !!profile,
        })
      }
      if (r('POST', /^\/child\/onboarding\/notice$/)) {
        account.noticeConfirmed = true
        return send(res, 204)
      }
      if (r('POST', /^\/child\/consents$/)) {
        if (!profile && (!body.heightCm || !body.weightKg))
          return problem(res, 400, '잘못된 요청', '키와 몸무게를 입력해 주세요.', req.url)
        account.consented = true
        return send(res, 204)
      }
      if (r('GET', /^\/child\/profile$/)) {
        const child = children.find((c) => c.id === account.childProfileId && !c.deleted)
        return child
          ? send(res, 200, childOf(child))
          : problem(res, 404, '찾을 수 없습니다', '프로필을 찾을 수 없습니다.', req.url)
      }
    }
    if (isChild) return problem(res, 401, '로그인이 필요합니다', '로그인이 필요합니다.', req.url)
    const me = Number(u.sub)
    if (p === '/wish' || p.startsWith('/wish/')) {
      const childId = String(body?.childId ?? url.searchParams.get('childId') ?? '')
      const owned = (id) =>
        children.some((c) => String(c.id) === id && c.memberId === me && !c.deleted)
      const refreshResult = (wish) => {
        const order = orders.find((item) => String(item.orderId) === wish.orderId)
        if (order?.status === 'PAID' || order?.status === 'CANCELLED')
          wish.orderResult = order.status
        return wish
      }
      const request = (id) => {
        const wish = wishRequests.find((w) => w.requestId === id && owned(w.childId))
        return wish && refreshResult(wish)
      }
      if (r('POST', /^\/wish\/items$/)) {
        if (!owned(childId)) return wishProblem(res, 'CHILD_NOT_FOUND', req.url)
        if (badQuantity(body.quantity)) return wishProblem(res, 'INVALID_QUANTITY', req.url)
        const rp = replica[body.optionId]
        if (!rp) return wishProblem(res, 'PRODUCT_OPTION_NOT_FOUND', req.url)
        const existing = wishItems.find(
          (item) => item.childId === childId && item.optionId === String(body.optionId),
        )
        if (existing) {
          if (existing.requestId) return wishProblem(res, 'WISH_ITEM_IN_REQUEST', req.url)
          if (badQuantity(existing.quantity + body.quantity))
            return wishProblem(res, 'INVALID_QUANTITY', req.url)
          existing.quantity += body.quantity
          existing.lineAmount = existing.quantity * existing.unitPrice
          return send(res, 200, existing)
        }
        const item = {
          wishItemId: String(nid()),
          childId,
          optionId: String(body.optionId),
          productId: String(rp.productId),
          sellerId: String(rp.sellerId),
          productName: rp.name,
          optionName: rp.optionName,
          size: rp.size,
          sellerName: '테스트상점',
          quantity: body.quantity,
          unitPrice: rp.price,
          purchasable: true,
          lineAmount: body.quantity * rp.price,
          addedBy: 'PARENT',
          addedAt: now(),
          saleStatus: 'ON_SALE',
          requestId: null,
        }
        wishItems.push(item)
        return send(res, 201, item)
      }
      if (r('GET', /^\/wish$/)) {
        if (!owned(childId)) return wishProblem(res, 'CHILD_NOT_FOUND', req.url)
        const items = wishItems.filter((item) => item.childId === childId).reverse()
        return send(res, 200, {
          childId,
          items,
          totalAmount: items.reduce((sum, item) => sum + item.lineAmount, 0),
        })
      }
      if (r('POST', /^\/wish\/requests$/)) {
        if (!owned(childId)) return wishProblem(res, 'CHILD_NOT_FOUND', req.url)
        if (
          !Array.isArray(body.wishItemIds) ||
          !body.wishItemIds.length ||
          new Set(body.wishItemIds).size !== body.wishItemIds.length ||
          (body.message?.length ?? 0) > 100
        )
          return wishProblem(res, 'INVALID_WISH_REQUEST', req.url)
        const items = wishItems.filter(
          (item) => item.childId === childId && body.wishItemIds.includes(Number(item.wishItemId)),
        )
        if (items.length !== body.wishItemIds.length)
          return wishProblem(res, 'WISH_ITEM_NOT_FOUND', req.url)
        if (items.some((item) => item.requestId))
          return wishProblem(res, 'WISH_ITEM_IN_REQUEST', req.url)
        const requestId = String(nid())
        const wish = {
          requestId,
          childId,
          status: 'REQUESTED',
          requestedBy: 'PARENT',
          message: body.message,
          requestedAt: now(),
          checkout: null,
          orderId: null,
          orderResult: null,
          rejectReason: null,
          decidedAt: null,
          items: items.map(
            ({
              childId: _c,
              quantity,
              lineAmount: _l,
              addedBy: _b,
              addedAt: _a,
              requestId: _r,
              ...item
            }) => ({ ...item, requestedQuantity: quantity, approvedQuantity: null }),
          ),
        }
        items.forEach((item) => {
          item.requestId = requestId
        })
        wishRequests.push(wish)
        return send(res, 201, wish)
      }
      if (r('GET', /^\/wish\/requests$/)) {
        if (!owned(childId)) return wishProblem(res, 'CHILD_NOT_FOUND', req.url)
        return send(
          res,
          200,
          wishRequests
            .filter((wish) => wish.childId === childId)
            .map(refreshResult)
            .reverse(),
        )
      }
      if ((x = r('POST', /^\/wish\/requests\/(\d+)\/(approval|rejection)$/))) {
        const wish = request(x[1])
        if (!wish) return wishProblem(res, 'WISH_REQUEST_NOT_FOUND', req.url)
        // BE WishItem.unlockFrom: 이 조르기가 잠근 줄을 푼다 (keep에 든 줄은 그대로)
        const unlock = (keep = new Set()) =>
          wishItems
            .filter((item) => item.requestId === wish.requestId && !keep.has(item.wishItemId))
            .forEach((item) => {
              item.requestId = null
            })
        // 확인 순서는 BE WishRequestService: 값(400) → 처리 전(409) → 고른 줄(400)
        if (x[2] === 'rejection') {
          if (!WISH_REJECT_REASONS.includes(body.reason))
            return wishProblem(res, 'INVALID_REJECT_REASON', req.url)
          if (wish.status !== 'REQUESTED')
            return wishProblem(res, 'WISH_REQUEST_ALREADY_DECIDED', req.url)
          wish.status = 'REJECTED'
          wish.rejectReason = body.reason
          unlock()
        } else {
          if (
            body.checkout !== 'ORDER' ||
            !body.shippingAddress ||
            !body.items?.length ||
            body.items.some((item) => item?.wishItemId == null || item.unitPrice == null)
          )
            return wishProblem(res, 'INVALID_APPROVAL', req.url)
          if (wish.status !== 'REQUESTED')
            return wishProblem(res, 'WISH_REQUEST_ALREADY_DECIDED', req.url)
          const selected = body.items.map((item) => ({
            input: item,
            line: wish.items.find((line) => line.wishItemId === String(item.wishItemId)),
          }))
          if (
            new Set(body.items.map((item) => item.wishItemId)).size !== body.items.length ||
            selected.some(({ input, line }) => !line || badQuantity(input.quantity))
          )
            return wishProblem(res, 'INVALID_APPROVAL', req.url)
          // 주문은 주문하기와 같은 검사 (재고는 주문 뒤 서버 이벤트에서)
          if (selected.some(({ line }) => !line.purchasable))
            return wishProblem(res, 'PRODUCT_NOT_PURCHASABLE', req.url)
          if (selected.some(({ input, line }) => input.unitPrice !== replica[line.optionId]?.price))
            return problem(
              res,
              409,
              '가격이 바뀌었습니다',
              '상품 가격이 바뀌었습니다. 다시 확인해 주세요.',
              req.url,
            )
          const child = children.find((item) => String(item.id) === wish.childId)
          const items = selected.map(({ input, line }) => ({
            orderItemId: String(nid()),
            productId: line.productId,
            optionId: line.optionId,
            sellerId: line.sellerId,
            sellerName: line.sellerName,
            productName: line.productName,
            optionName: line.optionName,
            size: line.size,
            unavailableReason: null,
            unitPrice: input.unitPrice,
            quantity: input.quantity,
            amount: input.unitPrice * input.quantity,
            status: 'ORDERED',
            deliveredAt: null,
            confirmedAt: null,
            confirmType: null,
            child: child
              ? {
                  childId: String(child.id),
                  name: child.name,
                  heightCm: child.heightCm,
                  weightKg: child.weightKg,
                  bodyType: child.bodyType,
                }
              : null,
          }))
          const stall = stallNext
          stallNext = null
          const order = {
            orderId: nid(),
            memberId: me,
            status: 'PENDING_PAYMENT',
            cancelReason: null,
            totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
            orderedAt: now(),
            paymentDueAt: later(stall?.timeoutMs ?? PAYMENT_TIMEOUT_MS),
            shippingAddress: body.shippingAddress,
            items,
            deliveries: [],
          }
          orders.push(order)
          scheduleOrder(order, me, stall, false)
          wish.status = 'APPROVED'
          wish.checkout = 'ORDER'
          wish.orderId = String(order.orderId)
          selected.forEach(({ input, line }) => {
            line.approvedQuantity = input.quantity
          })
          unlock(new Set(selected.map(({ line }) => line.wishItemId)))
        }
        wish.decidedAt = now()
        return send(res, 200, wish)
      }
      if ((x = r('GET', /^\/wish\/requests\/(\d+)(\/timeline)?$/))) {
        const wish = request(x[1])
        if (!wish) return wishProblem(res, 'WISH_REQUEST_NOT_FOUND', req.url)
        if (!x[2]) return send(res, 200, wish)
        // BE WishTimelineView.of: 보냄 → 상태에 따라 승인(대기 · 완료) 또는 거절 하나
        const decision =
          wish.status === 'REQUESTED'
            ? { step: 'APPROVED', status: 'WAITING', at: null }
            : { step: wish.status, status: 'DONE', at: wish.decidedAt }
        // 바로 결제한 주문이 있으면 주문 단계를 이어 붙인다
        const order = orders.find((item) => String(item.orderId) === wish.orderId)
        return send(res, 200, {
          requestId: wish.requestId,
          status: wish.status,
          checkout: wish.checkout,
          rejectReason: wish.rejectReason,
          orderId: wish.orderId,
          steps: [
            { step: 'SENT', status: 'DONE', at: wish.requestedAt },
            decision,
            ...(order ? orderStepsOf(order) : []),
          ],
        })
      }
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
    if (r('GET', /^\/seller\/settlement-targets$/))
      return send(
        res,
        200,
        page(
          confirmedItems()
            .filter((x) => String(x.item.sellerId) === String(me) && !x.item.settled)
            .map(itemOf),
        ),
      )
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
      }
      settlementRuns.push(run)
      return send(res, 201, run)
    }
    // 자녀 맞춤 목록 (BE #316 · #681): 판매 중 상품 중 자녀에게 맞는 사이즈가 있는 것, 최신순
    if (r('GET', /^\/recommendations\/products$/)) {
      const childId = url.searchParams.get('childId')
      if (!childId) return problem(res, 400, '잘못된 요청입니다', 'childId는 필수입니다.', req.url)
      const c = children.find((c) => c.id === +childId && c.memberId === me && !c.deleted)
      if (!c)
        return problem(res, 404, '자녀를 찾을 수 없습니다', '자녀를 찾을 수 없습니다.', req.url)
      // 말단 카테고리만 거른다 (BE: 정확히 같은 categoryId)
      const categoryId = url.searchParams.get('categoryId')
      const byCategory = new URLSearchParams(categoryId ? { categoryId } : {})
      const content = productListOf(byCategory).flatMap((item) => {
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
      return send(res, 200, pageFrom(content, url.searchParams))
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
      return send(res, 200, sizeRecommendationOf(detail, c))
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
    if (r('GET', /^\/seller\/products$/)) return send(res, 200, page(sellerListOf(me)))
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
    // 관리자 상품 기준 데이터 (catalog.mjs)
    const catalog = catalogRoute(m, p, body)
    if (catalog) {
      if (!isAdmin(u))
        return problem(res, 403, '권한이 없습니다', '관리자만 할 수 있습니다.', req.url)
      const result = catalog()
      return result.body
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
      const t = now()
      const growth = [
        { id: nid(), heightCm: body.heightCm, bodyType: body.bodyType, recordedAt: t },
      ]
      const c = {
        id: nid(),
        memberId: me,
        ...body,
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
    if (r('POST', /^\/cart\/items$/)) {
      if (badQuantity(body.quantity)) return invalidQuantity(res)
      const rp = replica[body.optionId]
      if (!rp)
        return problem(
          res,
          404,
          '상품 옵션을 찾을 수 없습니다',
          '상품 옵션을 다시 확인해 주세요.',
          req.url,
        )
      const l = {
        cartItemId: String(nid()),
        memberId: me,
        optionId: String(body.optionId),
        productId: String(rp.productId),
        sellerId: String(rp.sellerId),
        sellerName: '테스트상점',
        productName: rp.name,
        optionName: rp.optionName,
        size: rp.size,
        childId: body.childId ? String(body.childId) : null,
        quantity: body.quantity,
        unitPrice: rp.price,
        purchasable: true,
      }
      cart.push(l)
      return send(res, 201, lineOf(l))
    }
    if (r('GET', /^\/cart$/)) {
      const items = cart.filter((l) => l.memberId === me).map(lineOf)
      return send(res, 200, { items, totalAmount: items.reduce((s, l) => s + l.lineAmount, 0) })
    }
    if ((x = r('PATCH', /^\/cart\/items\/(\d+)$/))) {
      if (badQuantity(body.quantity)) return invalidQuantity(res)
      const l = cart.find((l) => l.cartItemId === x[1])
      l.quantity = body.quantity
      return send(res, 200, lineOf(l))
    }
    if ((x = r('DELETE', /^\/cart\/items\/(\d+)$/))) {
      cart.splice(
        cart.findIndex((l) => l.cartItemId === x[1]),
        1,
      )
      return send(res, 204)
    }
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
            // BE: 판매 주문 목록의 sellerName은 늘 null (OrderDetailResponse.Item 재사용)
            items: o.items.map((it) => ({ ...it, sellerName: null })),
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
      return send(res, 200, { ...d, orderId: String(o.orderId) })
    }
    if ((x = r('POST', /^\/seller\/orders\/(\d+)\/deliver$/))) {
      const { d, o } = sellerOrders().find(({ d }) => d.sellerOrderId === x[1])
      Object.assign(d, { status: 'DELIVERED', deliveredAt: now() })
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
    if (r('GET', /^\/admin\/seller-applications$/))
      return send(res, 200, page(apps.map(appSummaryOf)))
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
