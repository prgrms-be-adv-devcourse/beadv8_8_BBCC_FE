import { expect, test } from '@playwright/test'
import { base } from './support/child-wish'

// 주문 내역 페이지 이동 (#393): BE는 최근 주문부터 20건씩. 보호자(회원 1)의 주문을 21건 넘게 만든 뒤 2페이지로 간다.
// 공용 보호자의 주문이 늘어나므로 다른 흐름 뒤(zz-)에 둔다
test('주문 내역이 20건을 넘으면 다음 페이지로 간다', async ({ page, request }) => {
  const token = await request.post(`${base}/dev/tokens`, {
    data: { memberId: 1, roles: ['BUYER'] },
  })
  const headers = { authorization: `Bearer ${(await token.json()).accessToken}` }
  const option = (await request.get(`${base}/products/1`).then((res) => res.json())).options[0]
  const total = async () =>
    (await request.get(`${base}/orders?page=0&size=1`, { headers }).then((res) => res.json()))
      .totalElements as number
  // 결제는 처리하지 않게 해 공용 보호자 잔액을 쓰지 않는다 (주문 수만 늘린다). 멈춤은 다음 주문 하나에만 걸린다
  while ((await total()) < 21) {
    await request.post(`${base}/__fake/payment-stall`, { data: {} })
    const placed = await request.post(`${base}/orders`, {
      headers,
      data: {
        items: [{ optionId: option.optionId, childId: null, quantity: 1, unitPrice: option.price }],
        shippingAddress: {
          recipientName: '페이지',
          phone: '010',
          zipCode: '04524',
          address: '서울',
        },
      },
    })
    expect(placed.status()).toBe(201)
  }

  await page.goto('/login')
  await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/orders')
  const first = page.getByRole('listitem').filter({ hasText: '주문번호' }).first()
  const newest = await first.textContent()
  await page
    .getByRole('navigation', { name: '페이지' })
    .getByRole('button', { name: '2페이지' })
    .click()
  await expect(page).toHaveURL(/[?&]page=1/)
  await expect(page.getByRole('listitem').filter({ hasText: '주문번호' }).first()).not.toHaveText(
    newest ?? '',
  )
})
