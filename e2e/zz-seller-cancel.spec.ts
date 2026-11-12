import { expect, test, type Page } from '@playwright/test'
import { acceptConfirms } from './support/confirm'

// 판매자 발송 전 취소(BE #655): 판매자가 자기 몫을 취소하면 구매자 화면에 취소 · 환불이 보인다.
// 회원 1의 주문 · 예치금을 바꾸므로 맨 뒤(zz-)에 둔다
const API = 'http://localhost:18080/api/v1'

async function switchRole(page: Page, role: '보호자' | '판매자') {
  await page.getByRole('button', { name: role, exact: true }).first().click()
  await expect(
    page.getByText(role === '보호자' ? '보호자 · 회원 1' : '테스트상점 · 회원 2'),
  ).toBeVisible()
}

test('판매자 발송 전 취소 → 판매자 · 구매자 화면에 취소 · 환불', async ({ page, request }) => {
  await acceptConfirms(page)
  const token = await request
    .post(`${API}/dev/tokens`, { data: { memberId: 1, nickname: '보호자', roles: ['BUYER'] } })
    .then((res) => res.json())
  const auth = { authorization: `Bearer ${token.accessToken}` }
  const option = (await request.get(`${API}/products/1`).then((res) => res.json())).options[0]
  await request.post(`${API}/wallets/me/charges/confirm`, {
    headers: auth,
    data: { orderId: `cancel-${Date.now()}`, amount: option.price, paymentKey: 'e2e' },
  })
  const placed = await request
    .post(`${API}/orders`, {
      headers: auth,
      data: {
        items: [{ optionId: option.optionId, childId: null, quantity: 1, unitPrice: option.price }],
        shippingAddress: {
          recipientName: '취소 확인',
          phone: '010-0000-0000',
          zipCode: '06000',
          address: '서울시',
        },
      },
    })
    .then((res) => res.json())
  let sellerOrderId = ''
  await expect(async () => {
    const order = await request
      .get(`${API}/orders/${placed.orderId}`, { headers: auth })
      .then((res) => res.json())
    expect(order.status).toBe('PAID')
    sellerOrderId = order.deliveries[0].sellerOrderId
  }).toPass({ timeout: 10_000 })

  await test.step('판매자: 사유를 고르고 발송 전 취소', async () => {
    await page.goto('/center')
    await switchRole(page, '판매자')
    await page.goto(`/center/orders/${sellerOrderId}`)
    await page.getByRole('button', { name: '발송 전 취소' }).click()
    const submit = page.getByRole('button', { name: '취소하기' })
    await expect(submit).toBeDisabled()
    await page.getByRole('radio', { name: '재고 없음' }).check()
    await page.getByRole('textbox', { name: /메모/ }).fill('재입고 미정')
    await submit.click()
    await expect(page.getByRole('heading', { name: '취소됨' })).toBeVisible()
    await expect(
      page.getByText('발송 전에 취소했어요. 구매자에게 이 상품 값이 돌아가요.'),
    ).toBeVisible()
    await expect(page.getByText('취소됨', { exact: true }).last()).toBeVisible()
    await expect(page.getByRole('button', { name: '발송 전 취소' })).toHaveCount(0)
  })

  await test.step('구매자: 판매자 취소 · 환불 안내', async () => {
    await switchRole(page, '보호자')
    await page.goto(`/orders/${placed.orderId}`)
    await expect(page.getByText(/판매자가 주문을 취소했어요\./)).toBeVisible()
    await expect(page.getByText(/결제한 예치금은 돌려드렸어요\./)).toBeVisible()
  })
})
