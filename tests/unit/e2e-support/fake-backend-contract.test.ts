import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { toAddressRequest } from '@/entities/address'
import { addressShape } from '@/entities/address/api/address.shape'
import { toAddCartItemRequest } from '@/entities/cart'
import { cartShape } from '@/entities/cart/api/cart.shape'
import { toChildRequest } from '@/entities/child'
import { childShape, growthRecordShape } from '@/entities/child/api/child.shape'
import { adminMemberPageShape } from '@/entities/member/api/member.shape'
import { orderDetailShape, orderPageShape } from '@/entities/order/api/order.shape'
import { paymentDetailShape, paymentPageShape } from '@/entities/payment/api/payment.shape'
import { sellerOrderPageShape } from '@/entities/seller-order/api/seller-order.shape'
import { toSellerApplicationRequest } from '@/entities/seller'
import {
  sellerApplicationPageShape,
  sellerApplicationShape,
  sellerShape,
} from '@/entities/seller/api/seller.shape'
import { memberShape, tokenShape } from '@/entities/session/api/session.shape'
import {
  chargeCancelShape,
  chargeConfirmShape,
  chargePageShape,
  chargeShape,
  walletShape,
} from '@/entities/wallet/api/wallet.shape'
import { DEMO_ADDRESS } from '@/features/manage-address/config/demo-address'
import { DEMO_APPLICATION } from '@/features/apply-seller/config/demo-application'
import { DEMO_CHILD } from '@/features/register-child/config/demo-child'
import { arr, validate, type Shape } from '@/shared/api'

// E2E가 쓰는 가짜 백엔드의 응답이 FE 계약(응답 모양)과 같은지 확인한다.
// 어긋나면 E2E가 아니라 여기서 먼저, 어느 필드인지까지 드러난다.

const PORT = 18093
const BASE = `http://127.0.0.1:${PORT}/api/v1`
let server: ChildProcess
const tokens: Record<number, string> = {}

async function call(method: string, url: string, as: number | null, body?: unknown) {
  const response = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(as !== null && { authorization: `Bearer ${tokens[as]}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  return { status: response.status, data: text ? JSON.parse(text) : null }
}

/** 계약에 없는 필드(extra)는 깨지지 않으므로 빼고 본다 */
function expectContract(data: unknown, shape: Shape) {
  expect(validate(data, shape).filter((issue) => issue.type !== 'extra')).toEqual([])
}

beforeAll(async () => {
  server = spawn(process.execPath, [path.resolve('e2e/fake-backend/server.mjs')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  await new Promise<void>((resolve) => server.stdout!.once('data', () => resolve()))
  for (const [memberId, roles] of [
    [1, ['BUYER']],
    [2, ['BUYER', 'SELLER']],
    [3, ['ADMIN']],
  ] as const) {
    const token = await call('POST', '/dev/tokens', null, { memberId, roles })
    expectContract(token.data, tokenShape)
    tokens[memberId] = token.data.accessToken
  }
})

afterAll(() => {
  server?.kill()
})

describe('가짜 백엔드 응답 = FE 계약', () => {
  it('자녀 · 배송지 · 예치금', async () => {
    expectContract(
      (await call('POST', '/children', 1, toChildRequest(DEMO_CHILD))).data,
      childShape,
    )
    expectContract((await call('GET', '/children', 1)).data, arr(childShape))
    expectContract(
      (await call('POST', '/members/me/addresses', 1, toAddressRequest(DEMO_ADDRESS))).data,
      addressShape,
    )
    expectContract((await call('GET', '/members/me/addresses', 1)).data, arr(addressShape))
    expectContract((await call('GET', '/wallets/me', 1)).data, walletShape)

    // 회원 · 자녀 보완: 수정 · 성장 이력 · 삭제, 배송지 수정, 내 정보 수정
    const child = (await call('GET', '/children', 1)).data[0]
    const updated = await call('PATCH', `/children/${child.id}`, 1, {
      ...toChildRequest(DEMO_CHILD),
      heightCm: 118,
    })
    expectContract(updated.data, childShape)
    const growth = await call('GET', `/children/${child.id}/growth-records`, 1)
    expectContract(growth.data, arr(growthRecordShape))
    expect(growth.data).toHaveLength(2)
    const address = (await call('GET', '/members/me/addresses', 1)).data[0]
    expectContract(
      (
        await call(
          'PATCH',
          `/members/me/addresses/${address.id}`,
          1,
          toAddressRequest(DEMO_ADDRESS),
        )
      ).data,
      addressShape,
    )
    expectContract(
      (await call('PATCH', '/members/me', 1, { nickname: '새닉네임' })).data,
      memberShape,
    )
    const extra = await call('POST', '/children', 1, toChildRequest(DEMO_CHILD))
    expect((await call('DELETE', `/children/${extra.data.id}`, 1)).status).toBe(204)
    expect((await call('GET', `/children/${extra.data.id}`, 1)).status).toBe(404)
  })

  it('판매자 신청 · 승인', async () => {
    const mine = await call(
      'POST',
      '/members/me/seller-application',
      2,
      toSellerApplicationRequest(DEMO_APPLICATION),
    )
    expectContract(mine.data, sellerApplicationShape)
    expectContract(
      (await call('GET', '/members/me/seller-application', 2)).data,
      sellerApplicationShape,
    )
    expectContract(
      (await call('GET', '/admin/seller-applications', 3)).data,
      sellerApplicationPageShape,
    )
    const rejected = await call('POST', `/admin/seller-applications/${mine.data.id}/reject`, 3, {
      reason: '서류 미비',
    })
    expect(rejected.status).toBe(200)
    // 거절 응답은 심사 목록 한 줄과 같은 모양
    expectContract(
      {
        content: [rejected.data],
        page: 0,
        size: 1,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
      },
      sellerApplicationPageShape,
    )
    const latest = await call('GET', '/members/me/seller-application', 2)
    expect(latest.data).toMatchObject({ status: 'REJECTED', rejectReason: '서류 미비' })
    expectContract((await call('GET', '/seller/me', 2)).data, sellerShape)
  })

  it('장바구니 → 주문 → 결제 완료 → 발송 · 배송 완료 → 구매확정', async () => {
    await call(
      'POST',
      '/cart/items',
      1,
      toAddCartItemRequest({ optionId: '2', childId: null, quantity: 1 }),
    )
    const cart = await call('GET', '/cart', 1)
    expectContract(cart.data, cartShape)

    const line = cart.data.items[0]
    const placed = await call('POST', '/orders', 1, {
      items: [
        { optionId: Number(line.optionId), childId: null, quantity: 1, unitPrice: line.unitPrice },
      ],
      shippingAddress: { recipientName: '홍길동', phone: '010', zipCode: '04524', address: '서울' },
    })
    expectContract(placed.data, orderDetailShape)
    const orderId = placed.data.orderId

    // 서버 이벤트(결제)는 2초 뒤에 끝난다
    let order = placed
    for (let i = 0; i < 20 && order.data.status === 'PENDING_PAYMENT'; i++) {
      await new Promise((resolve) => setTimeout(resolve, 250))
      order = await call('GET', `/orders/${orderId}`, 1)
    }
    expect(order.data.status).toBe('PAID')
    expectContract(order.data, orderDetailShape)
    expectContract((await call('GET', '/orders', 1)).data, orderPageShape)

    const payments = await call('GET', '/payments', 1)
    expectContract(payments.data, paymentPageShape)
    expect(payments.data.content[0]).toMatchObject({
      orderId: Number(orderId),
      status: 'COMPLETED',
    })
    expectContract(
      (await call('GET', `/payments/${payments.data.content[0].paymentId}`, 1)).data,
      paymentDetailShape,
    )

    const sellerOrders = await call('GET', '/seller/orders', 2)
    expectContract(sellerOrders.data, sellerOrderPageShape)
    const sellerOrderId = sellerOrders.data.content[0].sellerOrderId
    await call('POST', `/seller/orders/${sellerOrderId}/ship`, 2, {
      carrier: 'CJ',
      trackingNumber: '1234',
    })
    await call('POST', `/seller/orders/${sellerOrderId}/deliver`, 2)
    expectContract((await call('GET', '/seller/orders', 2)).data, sellerOrderPageShape)

    const itemId = order.data.items[0].orderItemId
    expect((await call('POST', `/orders/${orderId}/items/${itemId}/confirm`, 1)).status).toBe(200)
    expectContract((await call('GET', `/orders/${orderId}`, 1)).data, orderDetailShape)
  }, 15_000)

  it('관리자 회원 목록 · 이용 정지 · 판매자 자격 정지', async () => {
    expectContract(
      (await call('GET', '/admin/members?filter=SELLER', 3)).data,
      adminMemberPageShape,
    )
    const suspended = await call('POST', '/admin/sellers/2/suspend', 3, { reason: '정책 위반' })
    expectContract(suspended.data, sellerShape)
    expect((await call('POST', '/admin/members/1/suspend', 3, { reason: '테스트' })).status).toBe(
      204,
    )
    const list = await call('GET', '/admin/members?filter=SUSPENDED', 3)
    expectContract(list.data, adminMemberPageShape)
    expect(list.data.content[0]).toMatchObject({
      id: 1,
      status: 'SUSPENDED',
      suspendReason: '테스트',
    })
  })

  it('충전 승인 · 충전 조회', async () => {
    const confirmed = await call('POST', '/wallets/me/charges/confirm', 1, {
      paymentKey: 'pk',
      orderId: 'toss-77',
      amount: 50000,
    })
    expectContract(confirmed.data, chargeConfirmShape)
    expectContract((await call('GET', '/wallets/me/charges/77', 1)).data, chargeShape)
    const list = await call('GET', '/wallets/me/charges', 1)
    expectContract(list.data, chargePageShape)
    expect(list.data.content[0]).toMatchObject({ chargeId: 77, status: 'DONE' })
  })

  it('충전 취소 (BE ChargeCancelResponse)', async () => {
    const cancelled = await call('POST', '/wallets/me/charges/77/cancel', 1)
    expectContract(cancelled.data, chargeCancelShape)
    expect(cancelled.data).toMatchObject({ chargeId: 77, status: 'CANCELLED', amount: 50000 })
  })
})
