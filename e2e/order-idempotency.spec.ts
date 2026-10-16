import { expect, test } from '@playwright/test'

// 주문 멱등키 (BE #351) 계약을 가짜 백엔드로 확인한다. 화면 흐름에 영향이 없도록 회원 3(예치금 0)으로 주문한다
const API = 'http://localhost:18080/api/v1'

test('주문 멱등키: 같은 키 · 같은 내용은 주문 하나, 다른 내용은 409, 형식이 틀리면 400', async ({
  request,
}) => {
  const token = await request
    .post(`${API}/dev/tokens`, { data: { memberId: 3, nickname: '멱등 확인', roles: ['USER'] } })
    .then((res) => res.json())
  const auth = { authorization: `Bearer ${token.accessToken}` }
  const product = await request.get(`${API}/products/1`).then((res) => res.json())
  const option = product.options[0]
  const order = (quantity: number) => ({
    items: [{ optionId: option.optionId, childId: null, quantity, unitPrice: option.price }],
    shippingAddress: {
      recipientName: '멱등',
      phone: '010-0000-0000',
      zipCode: '06000',
      address: '서울시',
    },
  })
  const key = '0b5f6a3e-7c1d-4b2a-9e8f-1a2b3c4d5e6f'
  const place = (data: object, idempotencyKey?: string) =>
    request.post(`${API}/orders`, {
      data,
      headers: idempotencyKey ? { ...auth, 'idempotency-key': idempotencyKey } : auth,
    })

  const first = await place(order(1), key)
  expect(first.status()).toBe(201)
  const again = await place(order(1), key.toUpperCase())
  expect(again.status()).toBe(200)
  expect((await again.json()).orderId).toBe((await first.json()).orderId)

  const changed = await place(order(2), key)
  expect(changed.status()).toBe(409)
  expect((await changed.json()).title).toBe('이미 다른 주문에 쓴 요청입니다')

  expect((await place(order(1), 'not-a-uuid')).status()).toBe(400)
  // 헤더가 없으면 지금처럼 매번 새 주문
  const a = await place(order(1))
  const b = await place(order(1))
  expect((await a.json()).orderId).not.toBe((await b.json()).orderId)
})
