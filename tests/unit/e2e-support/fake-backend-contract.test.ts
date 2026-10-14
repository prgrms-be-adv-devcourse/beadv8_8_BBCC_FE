import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { toAddressRequest } from '@/entities/address'
import { addressShape } from '@/entities/address/api/address.shape'
import { toAddCartItemRequest } from '@/entities/cart'
import { cartShape } from '@/entities/cart/api/cart.shape'
import { toChildRequest } from '@/entities/child'
import { childShape } from '@/entities/child/api/child.shape'
import { orderDetailShape, orderPageShape } from '@/entities/order/api/order.shape'
import { paymentDetailShape, paymentPageShape } from '@/entities/payment/api/payment.shape'
import { sellerOrderPageShape } from '@/entities/seller-order/api/seller-order.shape'
import { toSellerApplicationRequest } from '@/entities/seller'
import {
  sellerApplicationPageShape,
  sellerApplicationShape,
} from '@/entities/seller/api/seller.shape'
import { tokenShape } from '@/entities/session/api/session.shape'
import { chargeConfirmShape, chargeShape, walletShape } from '@/entities/wallet/api/wallet.shape'
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

  it('충전 승인 · 충전 조회', async () => {
    const confirmed = await call('POST', '/wallets/me/charges/confirm', 1, {
      paymentKey: 'pk',
      orderId: 'toss-77',
      amount: 50000,
    })
    expectContract(confirmed.data, chargeConfirmShape)
    expectContract((await call('GET', '/wallets/me/charges/77', 1)).data, chargeShape)
  })
})
