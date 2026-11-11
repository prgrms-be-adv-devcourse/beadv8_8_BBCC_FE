import { expect, test, type Page } from '@playwright/test'

// 상품 상세 맨 아래 「함께 사면 좋은 상품」(BE #1164): 자녀를 골랐을 때 상세와 함께 바로 부르고,
// 기다리는 동안 자리를 두고, 이유가 없는 카드는 이유 칸을 숨기고, 실패(Gateway 504)하면 영역을 숨긴다.
// 상품 설명은 처음에 윗부분만 보이고 「상세정보 펼쳐보기」로 펼친다

const CHILD = {
  id: 501,
  name: '하윤',
  birthDate: '2019-05-01',
  gender: 'FEMALE',
  heightCm: 118,
  weightKg: 21,
  bodyType: 'NORMAL',
  preferredFit: 'LOOSE',
  growthRecordCount: 1,
  hasOptionalConsent: true,
  lastRecordedAt: null,
}

const card = (n: number, reason: string | null) => ({
  productId: String(9100 + n),
  name: `함께 상품 ${n}`,
  thumbnailUrl: null,
  businessName: '테스트상점',
  minPrice: 15000 + n,
  recommendedSize: '120',
  reason,
})

const REASON = '맨투맨과 같은 톤이라 함께 입기 좋아요.'

async function asParentWithChild(page: Page) {
  await page.route('**/api/v1/children', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: [CHILD] }) : route.fallback(),
  )
  await page.route('**/api/v1/children/501', (route) => route.fulfill({ json: CHILD }))
  await page.goto('/')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
}

const companionSection = (page: Page) => page.getByRole('region', { name: '함께 사면 좋은 상품' })

test('자녀를 고르면 함께 사면 좋은 상품을 부르고, 이유가 없는 카드는 이유 칸을 숨긴다', async ({
  page,
}) => {
  await asParentWithChild(page)
  let release = () => {}
  const answered = new Promise<void>((resolve) => (release = resolve))
  const requested: URL[] = []
  await page.route('**/api/v1/recommendations/companions?*', async (route) => {
    requested.push(new URL(route.request().url()))
    await answered
    await route.fulfill({ json: { source: 'AI', products: [card(1, REASON), card(2, null)] } })
  })

  await page.goto('/products/1?childId=501')
  const section = companionSection(page)
  await expect(section.getByRole('status', { name: '불러오는 중' })).toBeVisible()
  release()

  await expect(section.getByRole('link', { name: /함께 상품 1/ })).toBeVisible()
  await expect(section.getByRole('link', { name: /함께 상품 2/ })).toBeVisible()
  await expect(section.getByText(REASON)).toBeVisible()
  await expect(section.getByRole('listitem').nth(1).locator('p.bg-paper-2')).toHaveCount(0)
  expect(requested[0]?.searchParams.get('productId')).toBe('1')
  expect(requested[0]?.searchParams.get('childId')).toBe('501')
})

test('자녀를 고르지 않았으면 부르지 않고, 실패(504)하면 영역을 숨긴다', async ({ page }) => {
  await asParentWithChild(page)
  let calls = 0
  await page.route('**/api/v1/recommendations/companions?*', (route) => {
    calls += 1
    return route.fulfill({ status: 504, body: 'Gateway Timeout' })
  })

  await page.goto('/products/1')
  await expect(page.getByRole('heading', { name: '데일리 맨투맨 (상품 A)' })).toBeVisible()
  expect(calls).toBe(0)

  await page.goto('/products/1?childId=501')
  await expect.poll(() => calls).toBe(1)
  await expect(page.getByRole('heading', { name: '리뷰' })).toBeVisible()
  await expect(companionSection(page)).toHaveCount(0)
})

test('긴 상품 설명은 접혀 있다가 「상세정보 펼쳐보기」로 펼친다', async ({ page }) => {
  await page.route('**/api/v1/products/1', async (route) => {
    const response = await route.fetch()
    const json = await response.json()
    await route.fulfill({
      response,
      json: { ...json, description: '부드러운 기모 안감. '.repeat(40) },
    })
  })
  await page.goto('/products/1')

  const toggle = page.getByRole('button', { name: '상세정보 펼쳐보기' })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.click()
  await expect(page.getByRole('button', { name: '상세정보 접기' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
})
