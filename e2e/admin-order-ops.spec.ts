import { expect, test } from '@playwright/test'
import { signInAdmin } from './support/admin'

// 관리자 주문 운영: 멈춘 주문 종류별 건수 → 목록 + AI 진단 메모 → 주문 상세로 이동 (BE #445 · #926)
const API = 'http://localhost:18080/api/v1'

test('관리자 주문 운영: 발송 지연 주문과 AI 메모를 보고 주문 상세로 간다', async ({
  page,
  request,
}) => {
  // 발송 준비로 남는 결제 완료 주문을 하나 만든다 (회원 4: 화면 흐름 테스트와 섞이지 않게)
  const token = await request
    .post(`${API}/dev/tokens`, { data: { memberId: 4, nickname: '운영 확인', roles: ['BUYER'] } })
    .then((res) => res.json())
  const auth = { authorization: `Bearer ${token.accessToken}` }
  const option = (await request.get(`${API}/products/1`).then((res) => res.json())).options[0]
  await request.post(`${API}/wallets/me/charges/confirm`, {
    headers: auth,
    data: { orderId: `ops-${Date.now()}`, amount: option.price, paymentKey: 'e2e' },
  })
  const placed = await request
    .post(`${API}/orders`, {
      headers: auth,
      data: {
        items: [{ optionId: option.optionId, childId: null, quantity: 1, unitPrice: option.price }],
        shippingAddress: {
          recipientName: '운영',
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

  await signInAdmin(page)
  await page.getByRole('link', { name: '주문 운영' }).click()
  await expect(page).toHaveURL(/\/admin\/order-ops/)
  const delayed = page.getByRole('button', { name: /발송 지연/ })
  await expect(delayed).toHaveAttribute('aria-pressed', 'true')
  const item = page.getByRole('listitem').filter({ hasText: `주문 #${placed.orderId}` })
  await expect(item).toContainText('AI 진단 메모 · 확신 보통')
  await expect(item).toContainText('판매자가 아직 송장을 등록하지 않았어요.')
  await item.getByRole('link', { name: `주문 #${placed.orderId}` }).click()
  await expect(page).toHaveURL(new RegExp(`/admin/orders/${placed.orderId}$`))
})

test('관리자 주문 운영: 결제 반영 실패 · 이벤트 처리 실패 · 격리된 이벤트를 처리한다', async ({
  page,
}) => {
  await page.addLocatorHandler(page.getByRole('alertdialog'), async (dialog) => {
    await dialog.locator('[data-confirm]').click()
  })
  await signInAdmin(page)
  await page.goto('/admin/order-ops')

  await page.getByRole('tab', { name: '결제 반영 실패' }).click()
  const recovery = page.getByRole('listitem').filter({ hasText: '주문 #9001' })
  await expect(recovery).toContainText('ORDER_STATE_CONFLICT')
  await recovery.getByRole('button', { name: '다시 처리' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: '주문 #9001' })).toHaveCount(0)
  await page.getByRole('button', { name: '전체' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: '주문 #9001' })).toContainText('복구됨')

  await page.getByRole('tab', { name: '이벤트 처리 실패' }).click()
  const failure = page.getByRole('listitem').filter({ hasText: '주문 #9101' })
  await failure.getByRole('button', { name: '기록 끝내기' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: '주문 #9101' })).toHaveCount(0)

  await page.getByRole('tab', { name: '격리된 이벤트' }).click()
  const outbox = page.getByRole('listitem').filter({ hasText: '주문 결제 완료' })
  await expect(outbox).toContainText('오류 TimeoutException')
  await outbox.getByRole('button', { name: '다시 보내기' }).click()
  await expect(page.getByText('격리된 이벤트가 없어요.')).toBeVisible()
})
