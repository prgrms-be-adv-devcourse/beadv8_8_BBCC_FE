// E2E 전용 가짜 백엔드 (실제 백엔드 코드와 무관). 구현된 API의 응답 모양(DTO)만 흉내 낸다.
// 상품 · 추천 · 정산 · 충전 취소는 FE 목(app/mocks)이 응답하므로 여기에는 없다.
// 응답 모양이 실제와 달라지면 FE 흐름 패널의 계약 검사로 드러난다.
import http from 'node:http'

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
  charges = []
const wallets = { 1: 100000, 2: 0, 3: 0 }
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
const replica = {
  1: { productId: 1, name: '데일리 맨투맨 (상품 A)', size: '110', price: 25000, sellerId: 2 },
  2: { productId: 1, name: '데일리 맨투맨 (상품 A)', size: '120', price: 25000, sellerId: 2 },
  3: { productId: 2, name: '조거', size: '120', price: 30000, sellerId: 2 },
}
const now = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 19)
const problem = (res, status, title, detail, instance) =>
  send(res, status, { type: 'about:blank', title, status, detail, instance })
function send(res, status, body) {
  res.writeHead(status, {
    'content-type': status >= 400 ? 'application/problem+json' : 'application/json',
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
    res.setHeader('access-control-allow-methods', 'GET,POST,PATCH,DELETE,OPTIONS')
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
    if (r('POST', /^\/dev\/tokens$/))
      return send(res, 200, {
        accessToken: `${b64({ alg: 'none' })}.${b64({ sub: String(body.memberId), nickname: body.nickname || '회원' + body.memberId, roles: body.roles })}.sig`,
      })
    if (r('POST', /^\/auth\/reissue$/))
      return problem(res, 401, '로그인이 만료되었습니다', '로그인이 만료되었습니다.', req.url)
    if (r('POST', /^\/auth\/logout$/)) return send(res, 204)
    if (!u) return problem(res, 401, '로그인이 필요합니다', '로그인이 필요합니다.', req.url)
    const me = Number(u.sub)
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
      })
      return send(res, 200, {
        chargeId: 77,
        status: 'DONE',
        amount: body.amount,
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
      })
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
        productName: rp.name,
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
          productName: rp.name,
          size: rp.size,
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
        paymentDueAt: now(),
        shippingAddress: body.shippingAddress,
        items,
        deliveries: [],
      }
      orders.push(o)
      for (let i = cart.length - 1; i >= 0; i--) if (cart[i].memberId === me) cart.splice(i, 1)
      setTimeout(() => {
        if ((wallets[me] ?? 0) < o.totalAmount) {
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
        payments.push({
          paymentId: nid(),
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
