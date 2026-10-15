// E2E 전용 가짜 백엔드 (실제 백엔드 코드와 무관). 구현된 API의 응답 모양(DTO)만 흉내 낸다.
// 상품은 등록 · 판매 시작 · 상세 · 카테고리만 있다(products.mjs). 판매자 상품 목록 · 상세 · 재고 조정 · 판매 중지도 products.mjs. 상품 목록 · 사이즈 추천 · 자녀 맞춤 목록 · 관리자 전체 주문 · 결제 · 정산은 여기서 응답하고, 상품 수정은 FE 목(app/mocks)이 응답한다.
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
  register,
  replica,
  sellerDetailOf,
  sellerListOf,
  stock,
} from './products.mjs'

const PORT = Number(process.env.PORT ?? 18080)
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
let id = 1
const nid = () => id++
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
// 관리자 회원 목록용 (기획서 7.1: 회원 1 보호자 · 2 판매자, 관리자는 목록에서 빠짐)
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
function who(req) {
  const t = (req.headers.authorization || '').split(' ')[1]
  if (!t) return null
  return JSON.parse(Buffer.from(t.split('.')[1], 'base64url'))
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
    res.setHeader('access-control-allow-headers', 'authorization,content-type')
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
    if (r('POST', /^\/dev\/tokens$/))
      return send(res, 200, {
        accessToken: `${b64({ alg: 'none' })}.${b64({ sub: String(body.memberId), nickname: body.nickname || '회원' + body.memberId, roles: body.roles })}.sig`,
      })
    if (r('POST', /^\/auth\/reissue$/))
      return problem(res, 401, '로그인이 만료되었습니다', '로그인이 만료되었습니다.', req.url)
    if (r('POST', /^\/auth\/logout$/)) return send(res, 204)
    // 공개 API: 카테고리 · 입력 항목 · 상품 상세
    if (r('GET', /^\/categories$/)) return send(res, 200, categoryTree)
    if ((x = r('GET', /^\/categories\/(\d+)\/attributes$/))) {
      const inputs = categoryInputs(+x[1])
      return inputs
        ? send(res, 200, inputs)
        : problem(res, 404, '찾을 수 없습니다', '카테고리를 찾을 수 없습니다.', req.url)
    }
    if (r('GET', /^\/products$/)) return send(res, 200, page(productListOf(url.searchParams)))
    if ((x = r('GET', /^\/products\/(\d+)$/))) {
      const detail = productDetailOf(x[1])
      return detail
        ? send(res, 200, detail)
        : problem(res, 404, '찾을 수 없습니다', '상품을 찾을 수 없습니다.', req.url)
    }
    if (!u) return problem(res, 401, '로그인이 필요합니다', '로그인이 필요합니다.', req.url)
    const me = Number(u.sub)
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
      if (!(u.roles || []).includes('ADMIN'))
        return problem(res, 403, '권한이 없습니다', '관리자만 실행할 수 있습니다.', req.url)
      const cutoffOn = body?.cutoffOn
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoffOn ?? ''))
        return problem(res, 400, '잘못된 요청입니다', '종료 기준일을 넣어 주세요.', req.url)
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
    // 자녀 맞춤 목록 (BE #316): 판매 중 상품 중 자녀에게 맞는 사이즈가 있는 것, 최신순
    if ((x = r('GET', /^\/children\/(\d+)\/recommended-products$/))) {
      const c = children.find((c) => c.id === +x[1] && c.memberId === me && !c.deleted)
      if (!c)
        return problem(res, 404, '자녀를 찾을 수 없습니다', '자녀를 찾을 수 없습니다.', req.url)
      const content = productListOf(new URLSearchParams()).flatMap((item) => {
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
      return send(res, 200, page(content))
    }
    // 관리자 전체 주문 (BE #323) · 전체 결제 (BE #326): 최근 것부터
    if (r('GET', /^\/admin\/orders$/)) {
      if (!(u.roles || []).includes('ADMIN'))
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
      if (!(u.roles || []).includes('ADMIN'))
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
    // 사이즈 추천 (BE #262). 규칙은 단순화: 키가 권장 키 ±2cm 안이면 후보, 둘 이상이면 체형 · 선호 핏으로 고름
    if ((x = r('GET', /^\/products\/(\d+)\/size-recommendation$/))) {
      const detail = productDetailOf(x[1])
      if (!detail || detail.status !== 'ON_SALE')
        return problem(res, 404, '상품을 찾을 수 없습니다', '상품을 찾을 수 없습니다.', req.url)
      const childId = Number(url.searchParams.get('childId'))
      const c = children.find((c) => c.id === childId && c.memberId === me && !c.deleted)
      if (!c)
        return problem(res, 404, '자녀를 찾을 수 없습니다', '자녀를 찾을 수 없습니다.', req.url)
      return send(res, 200, sizeRecommendationOf(detail, c))
    }
    if (r('POST', /^\/seller\/products$/)) {
      const result = register(me, body)
      return result.status === 201
        ? send(res, 201, result.body, { location: result.location })
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
      if (!(u.roles || []).includes('ADMIN'))
        return problem(res, 403, '권한이 없습니다', '관리자만 할 수 있습니다.', req.url)
      const result = adminChangeSaleStatus(x[1], body)
      return result.status === 200
        ? send(res, 200, result.body)
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
      wallets[me] = (wallets[me] ?? 0) + body.amount
      charges.push({
        chargeId: 77,
        memberId: me,
        orderId: body.orderId,
        amount: body.amount,
        status: 'DONE',
        approvedAt: now(),
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
      const stall = stallNext
      stallNext = null
      // 결제 마감: 그때까지 결제 처리 중이면 PAYMENT_EXPIRED로 취소 (BE 마감 스케줄러)
      setTimeout(() => {
        if (o.status !== 'PENDING_PAYMENT') return
        o.status = 'CANCELLED'
        o.cancelReason = 'PAYMENT_EXPIRED'
      }, stall?.timeoutMs ?? PAYMENT_TIMEOUT_MS).unref()
      if (!stall)
        setTimeout(() => {
          // 상품: 하나라도 부족하면 아무것도 차감하지 않고 주문 취소 (기획서 4장).
          // 장바구니는 그대로 남는다 (BE: 결제 완료 뒤 주문한 줄만 빠진다)
          const short = o.items.filter((it) => (stock[it.optionId] ?? 0) < it.quantity)
          if (short.length > 0) {
            o.status = 'CANCELLED'
            o.cancelReason = 'OUT_OF_STOCK'
            short.forEach((it) => (it.unavailableReason = 'OUT_OF_STOCK'))
            return
          }
          o.items.forEach((it) => (stock[it.optionId] -= it.quantity))
          if ((wallets[me] ?? 0) < o.totalAmount) {
            // 결제 실패 → 주문 취소 · 재고 복구
            o.items.forEach((it) => (stock[it.optionId] += it.quantity))
            o.status = 'CANCELLED'
            o.cancelReason = 'PAYMENT_FAILED'
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
            items: o.items,
            deliveredAt: d.deliveredAt,
          })),
        ),
      )
    if ((x = r('POST', /^\/seller\/orders\/(\d+)\/ship$/))) {
      const { d, o } = sellerOrders().find(({ d }) => d.sellerOrderId === x[1])
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
          '이미 정지 · 탈퇴했거나 관리자인 회원입니다.',
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
