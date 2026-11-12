import { expect, test } from '@playwright/test'
import {
  apiActors,
  base,
  loginChild,
  registerChildWithAccount,
  sendWish,
} from './support/child-wish'

// 나를 위해 산 것(BE #1000). 보호자(회원 1) 예치금을 충전해 결제하므로 맨 뒤(zz-)에 둔다
test('자녀가 나를 위해 산 것에서 조르기로 산 상품을 본다', async ({ page, context, request }) => {
  const { childId, loginId } = await registerChildWithAccount(page)
  const { guardian, child } = await apiActors(request, loginId)
  const requestId = await sendWish(request, child, [{ optionId: 3, quantity: 1 }], null)
  const wish = await request
    .get(`${base}/wish/requests/${requestId}`, { headers: child })
    .then((res) => res.json())
  const line = wish.items[0]
  await request.post(`${base}/wallets/me/charges/confirm`, {
    headers: guardian,
    data: { orderId: `child-purchase-${Date.now()}`, amount: line.unitPrice, paymentKey: 'e2e' },
  })
  const placed = await request
    .post(`${base}/orders`, {
      headers: guardian,
      data: {
        items: [
          {
            optionId: Number(line.optionId),
            childId: Number(childId),
            quantity: 1,
            unitPrice: line.unitPrice,
            cartItemId: Number(line.cartItemId),
          },
        ],
        shippingAddress: {
          recipientName: '부모',
          phone: '010-0000-0000',
          zipCode: '04524',
          address: '서울시',
        },
      },
    })
    .then((res) => res.json())
  await expect(async () => {
    const order = await request
      .get(`${base}/orders/${placed.orderId}`, { headers: guardian })
      .then((res) => res.json())
    expect(order.status).toBe('PAID')
  }).toPass({ timeout: 10_000 })

  const childPage = await context.newPage()
  await loginChild(childPage, loginId)
  await childPage.getByRole('link', { name: '나를 위해 산 것' }).click()
  await expect(childPage).toHaveURL(/\/child\/purchases$/)
  const card = childPage.getByRole('article').first()
  await expect(card).toContainText(line.productName)
  await expect(card).toContainText('결제 완료')
  await expect(card).toContainText('조르기로 산 것')
})
