import { expect, test, type Page } from '@playwright/test'
import { acceptConfirms } from './support/confirm'

// 구매자 발송 전 주문 취소(BE #354). 회원 1의 주문 · 예치금을 바꾸므로 맨 뒤(zz-)에 둔다
const API = 'http://localhost:18080/api/v1'

async function signInGuardian(page: Page) {
  await page.goto('/login')
  await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
  await expect(page).toHaveURL('/')
}

test('구매자가 발송 전 주문을 취소하면 취소 · 환불 안내가 보이고 버튼이 사라진다', async ({
  page,
  request,
}) => {
  await acceptConfirms(page)
  const token = await request
    .post(`${API}/dev/tokens`, { data: { memberId: 1, nickname: '보호자', roles: ['BUYER'] } })
    .then((res) => res.json())
  const auth = { authorization: `Bearer ${token.accessToken}` }
  const option = (await request.get(`${API}/products/1`).then((res) => res.json())).options[0]
  await request.post(`${API}/wallets/me/charges/confirm`, {
    headers: auth,
    data: { orderId: `buyer-cancel-${Date.now()}`, amount: option.price, paymentKey: 'e2e' },
  })
  const placed = await request
    .post(`${API}/orders`, {
      headers: auth,
      data: {
        items: [{ optionId: option.optionId, childId: null, quantity: 1, unitPrice: option.price }],
        shippingAddress: {
          recipientName: '구매자 취소',
          phone: '010-0000-0000',
          zipCode: '06000',
          address: '서울시',
        },
      },
    })
    .then((res) => res.json())
  await expect(async () => {
    const order = await request
      .get(`${API}/orders/${placed.orderId}`, { headers: auth })
      .then((res) => res.json())
    expect(order.status).toBe('PAID')
  }).toPass({ timeout: 10_000 })

  await signInGuardian(page)
  await page.goto(`/orders/${placed.orderId}`)
  await page.getByRole('button', { name: '주문 취소' }).click()
  await expect(page.getByText(/주문을 취소했어요\./)).toBeVisible()
  await expect(page.getByText(/결제한 예치금은 돌려드렸어요\./)).toBeVisible()
  await expect(page.getByRole('button', { name: '주문 취소' })).toHaveCount(0)
})
