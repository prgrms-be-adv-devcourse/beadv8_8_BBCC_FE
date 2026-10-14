import { expect, test, type Page } from '@playwright/test'

// 사용자 화면(쇼핑 · 판매자 센터 · 관리자)으로 같은 흐름을 따라간다.
// 시연 콘솔 테스트와 가짜 백엔드를 같이 쓰므로, 앞선 테스트가 남긴 데이터가 있어도 통과하게 쓴다.

const NICKNAME = {
  보호자: '보호자 · 회원 1',
  판매자: '테스트상점 · 회원 2',
  관리자: '관리자 · 회원 3',
} as const

async function switchRole(page: Page, role: keyof typeof NICKNAME) {
  await page.getByRole('button', { name: role, exact: true }).first().click()
  await expect(page.getByText(NICKNAME[role])).toBeVisible()
}

test('사용자 화면: 상품 등록 → 쇼핑 주문 → 발송 → 구매확정', async ({ page }) => {
  const pageErrors: string[] = []
  const warnings: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text().includes('HydrateFallback'))
      warnings.push(message.text())
  })
  page.on('dialog', (dialog) => dialog.accept())

  await test.step('관리자 영역: 관리자가 아니면 안내', async () => {
    await page.goto('/admin')
    await switchRole(page, '보호자')
    await expect(page.getByText('관리자 계정으로 볼 수 있는 화면이에요.')).toBeVisible()
  })

  await test.step('판매자 센터: 상품 등록 → 판매 시작 (목)', async () => {
    await switchRole(page, '판매자')
    await page.goto('/center/products')
    await expect(page.getByRole('heading', { name: '상품 관리' })).toBeVisible()
    // 단계 번호 · 백엔드 설명은 콘솔에서만 보인다
    await expect(page.getByText('product.changed')).toHaveCount(0)
    await page.getByRole('button', { name: '등록하기' }).click()
    await page.getByRole('button', { name: '판매 시작' }).click()
    await expect(page.getByRole('button', { name: '판매 시작' })).toHaveCount(0)
  })

  await test.step('마이페이지: 자녀 · 배송지 등록', async () => {
    await switchRole(page, '보호자')
    await page.goto('/my/children')
    await page.getByRole('button', { name: '등록하기' }).click()
    await expect(page.getByText('#').first()).toBeVisible()
    await page.goto('/my/addresses')
    await page.getByRole('button', { name: '등록하기' }).click()
    await expect(page.getByText('기본', { exact: true }).first()).toBeVisible()
  })

  await test.step('마이페이지: 자녀 수정 → 성장 이력 · 이력 수정(목) · 배송지 수정', async () => {
    await page.goto('/my/children')
    await page
      .getByRole('link', { name: /테스트 상세/ })
      .first()
      .click()
    await expect(page.getByRole('heading', { name: '테스트 프로필' })).toBeVisible()
    await page.getByLabel('키 (cm)').fill('118')
    await page.getByRole('button', { name: '저장하기' }).click()
    await expect(page.getByText(/저장했어요/)).toBeVisible()
    await expect(page.getByText(/처음보다 \+3\.0cm/)).toBeVisible()
    await page.getByRole('listitem').getByRole('button', { name: '수정' }).first().click()
    await page.getByLabel('기록 키').fill('117')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await expect(page.getByText(/117\.0cm/)).toBeVisible()

    await page.goto('/my/addresses')
    await page.getByRole('button', { name: '수정' }).first().click()
    await expect(page.getByText('배송지 수정')).toBeVisible()
    await page.getByRole('button', { name: '저장하기' }).click()
    await expect(page.getByText('배송지 수정')).toHaveCount(0)
  })

  await test.step('쇼핑: 자녀 맞춤 상품 → 상세 추천 → 담기', async () => {
    await page.getByRole('link', { name: 'Kidly', exact: true }).click()
    await page
      .getByRole('button', { name: /테스트 맞춤/ })
      .first()
      .click()
    await expect(page.getByText(/테스트에게 맞는 상품/)).toBeVisible()
    await page.getByText('데일리 맨투맨 (상품 A)').first().click()
    await expect(page.getByText('추천 사이즈')).toBeVisible()
    await page.getByRole('button', { name: /네이비 \/ 면 \/ 120/ }).click()
    await page.getByRole('button', { name: '장바구니 담기' }).click()
    await page.getByRole('link', { name: '장바구니 보기' }).click()
    await expect(page).toHaveURL(/\/cart$/)
  })

  await test.step('쇼핑: 주문하기 → 진행 막대가 결제 완료로', async () => {
    await page.getByRole('button', { name: /주문하기/ }).click()
    await expect(page).toHaveURL(/\/orders\/\d+$/)
    await expect(page.getByRole('list', { name: '주문 진행' })).toBeVisible()
    await expect(page.locator('[aria-current="step"]')).toHaveText('2')
    await expect(page.getByRole('status', { name: '결제 확인' })).toContainText('일치')
  })
  const orderUrl = page.url()

  await test.step('흐름 서랍: 쇼핑에서도 API 호출을 본다', async () => {
    await page.getByRole('button', { name: /^API 흐름 \d+/ }).click()
    await expect(page.getByText('도메인 흐름')).toBeVisible()
    await expect(page.getByText('/orders', { exact: true }).first()).toBeVisible()
    await page.getByRole('button', { name: '닫기 ✕' }).click()
  })

  await test.step('판매자 센터: 홈 할 일 → 발송 → 배송 완료', async () => {
    await switchRole(page, '판매자')
    await page.goto('/center')
    await expect(page.getByText('발송할 주문')).toBeVisible()
    await expect(page.getByText('테스트상점').first()).toBeVisible()
    await expect(page.getByText('판매 가능')).toBeVisible()
    await page.getByRole('link', { name: '주문 · 배송' }).click()
    await page.getByRole('button', { name: '발송' }).first().click()
    await page.getByRole('button', { name: '배송 완료 처리' }).first().click()
    await expect(page.getByText('배송 완료', { exact: true }).first()).toBeVisible()
  })

  await test.step('쇼핑: 구매확정 → 진행 막대 끝까지', async () => {
    await switchRole(page, '보호자')
    await page.goto(orderUrl)
    await expect(page.locator('[aria-current="step"]')).toHaveText('4')
    await page.getByRole('button', { name: '구매확정' }).click()
    await expect(page.locator('[aria-current="step"]')).toHaveText('5')
  })

  await test.step('마이페이지 · 주문 내역', async () => {
    await page.getByRole('link', { name: '마이페이지' }).click()
    await expect(page.getByText('예치금').first()).toBeVisible()
    await expect(page.getByText('최근 결제 내역')).toBeVisible()
    await expect(page.getByText('결제 완료').first()).toBeVisible()
    await page.getByRole('link', { name: '주문 내역' }).first().click()
    await expect(page.getByText(/주문번호/).first()).toBeVisible()
  })

  await test.step('내 정보: 닉네임 수정 → 토큰 다시 받기 → 탈퇴(목)', async () => {
    await page.goto('/my/profile')
    await page.getByLabel(/닉네임/).fill('보호자맘')
    await page.getByRole('button', { name: '닉네임 바꾸기' }).click()
    await expect(page.getByText('보호자맘 · 회원 1').first()).toBeVisible()
    await page.getByRole('button', { name: '탈퇴하기' }).click()
    await expect(page.getByText('로그인 전')).toBeVisible()
  })

  expect(pageErrors).toEqual([])
  expect(warnings).toEqual([])
})
