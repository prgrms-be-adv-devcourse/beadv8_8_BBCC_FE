import { expect, test, type Page } from '@playwright/test'

// 시연 콘솔(/console)에서 정상 흐름 ①~⑦을 시연 순서대로 따라가며, 화면 결과와 흐름 확인(/verify) 판정까지 확인한다.
// 가짜 백엔드(e2e/fake-backend) + FE 목(상품 · 추천 · 정산 · 충전 취소)으로 돈다.

const NICKNAME = {
  보호자: '보호자 · 회원 1',
  판매자: '테스트상점 · 회원 2',
  관리자: '관리자 · 회원 3',
} as const

async function switchRole(page: Page, role: keyof typeof NICKNAME) {
  await page.getByRole('button', { name: role, exact: true }).first().click()
  await expect(page.getByText(NICKNAME[role])).toBeVisible()
}

test('시연 콘솔: 정상 흐름 ①~⑦', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('pageerror', (error) => consoleErrors.push(error.message))
  page.on('dialog', (dialog) => dialog.accept())

  await test.step('시작: 보호자로 전환', async () => {
    await page.goto('/console')
    await expect(page.getByText('Kidly 시연')).toBeVisible()
    await switchRole(page, '보호자')
  })

  await test.step('① 자녀 · 배송지 등록', async () => {
    await page.goto('/console/children')
    await page.getByRole('button', { name: '등록하기' }).click()
    await expect(page.getByText('#').first()).toBeVisible()
    await page.goto('/console/addresses')
    await page.getByRole('button', { name: '등록하기' }).click()
    await expect(page.getByText('기본', { exact: true })).toBeVisible()
  })

  await test.step('② 판매자 신청 → 관리자 승인', async () => {
    await page.goto('/console/seller/apply')
    await page.getByRole('button', { name: '신청하기' }).click()
    await expect(page.getByText('심사 중')).toBeVisible()
    await switchRole(page, '관리자')
    await page.goto('/console/admin/seller-applications')
    await page.getByRole('button', { name: '승인' }).click()
    await expect(page.getByText('승인됨')).toBeVisible()
  })

  await test.step('② 상품 등록 → 판매 시작 (목)', async () => {
    await switchRole(page, '판매자')
    await page.goto('/console/seller/products')
    await page.getByRole('button', { name: '등록하기' }).click()
    await page.getByRole('button', { name: '판매 시작' }).click()
    await expect(page.getByRole('button', { name: '판매 시작' })).toHaveCount(0)
  })

  await test.step('③ 자녀 맞춤 목록 → 상세 사이즈 추천 (목)', async () => {
    await switchRole(page, '보호자')
    await page.goto('/console/products')
    await page.getByRole('button', { name: /테스트 맞춤/ }).click()
    await expect(page.getByText(/추천 120/).first()).toBeVisible()
    await page.getByText('데일리 맨투맨 (상품 A)').first().click()
    await expect(page.getByText('추천 사이즈')).toBeVisible()
  })

  await test.step('④ 담기 → 주문하기 → 결제 완료(서버 이벤트)', async () => {
    await page.getByRole('button', { name: /네이비 \/ 면 \/ 120/ }).click()
    await page.getByRole('button', { name: '장바구니 담기' }).click()
    await expect(page.getByText('담았어요')).toBeVisible()
    await page.goto('/console/cart')
    await page.getByRole('button', { name: /주문하기/ }).click()
    await expect(page.getByText('결제 처리 중')).toBeVisible()
    await expect(page.getByText('결제 완료', { exact: true }).first()).toBeVisible()
  })
  const orderUrl = page.url()

  await test.step('⑤ 판매자 발송 → 배송 완료', async () => {
    await switchRole(page, '판매자')
    await page.goto('/console/seller/orders')
    await page.getByRole('button', { name: '발송' }).click()
    await page.getByRole('button', { name: '배송 완료 처리' }).click()
    await expect(page.getByText('배송 완료', { exact: true }).first()).toBeVisible()
  })

  await test.step('⑥ 구매확정', async () => {
    await switchRole(page, '보호자')
    await page.goto(orderUrl)
    await page.getByRole('button', { name: '구매확정' }).click()
    await expect(page.getByText(/구매확정$/).first()).toBeVisible()
  })

  await test.step('⑦ 정산 실행 → 정산서 (목)', async () => {
    await switchRole(page, '관리자')
    await page.goto('/console/admin/settlements')
    await page.getByRole('button', { name: '정산 실행' }).click()
    await expect(page.getByText(/지급 22,500원/)).toBeVisible()
    await switchRole(page, '판매자')
    await page.goto('/console/seller/settlements')
    await page.getByRole('button', { name: '상세' }).click()
    await expect(page.getByText(/구매확정 2026-10-13/).nth(1)).toBeVisible()
  })

  await test.step('④ 충전 승인(토스 복귀) → 충전 취소 (목)', async () => {
    await switchRole(page, '보호자')
    await page.goto('/console/wallet/charge/success?paymentKey=pk&orderId=toss-77&amount=50000')
    await expect(page.getByText(/50,000원 충전했어요/)).toBeVisible()
    await page.goto('/console/wallet')
    await page.getByRole('button', { name: '충전 취소' }).click()
    await expect(page.getByText(/취소 요청됨/)).toBeVisible()
  })

  await test.step('새로고침 뒤에도 시연 역할 유지', async () => {
    await page.reload()
    await expect(page.getByText(NICKNAME.보호자)).toBeVisible()
  })

  await test.step('흐름 확인: 정산 목 때문에 판매자 지갑 적립만 대기', async () => {
    await page.goto('/console/verify')
    await expect(page.getByText('통과 19')).toBeVisible()
    await expect(page.getByText('실패 0')).toBeVisible()
  })

  await test.step('흐름 패널: 상태 변화 · 계약 불일치 없음', async () => {
    await page.getByRole('button', { name: /^상태 변화/ }).click()
    await expect(page.getByText(/PENDING_PAYMENT → PAID/)).toBeVisible()
    await expect(page.getByRole('button', { name: /^계약 0/ })).toBeVisible()
  })

  await test.step('목 끄기 → 실제 서버로 감', async () => {
    await page.getByRole('button', { name: '목 설정' }).click()
    await page.locator('label', { hasText: '상품' }).locator('input').uncheck()
    await page.goto('/console/products')
    await expect(page.getByText(/없는 API GET \/products/)).toBeVisible()
  })

  expect(consoleErrors).toEqual([])
})
