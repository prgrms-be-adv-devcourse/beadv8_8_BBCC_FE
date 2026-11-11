import { expect, test, type Page, type Request } from '@playwright/test'

// 쇼핑 홈 카테고리 막대는 보호자가 고른 자녀의 성별에 맞는 카테고리만 보인다 (BE #1219):
// 남아면 여아 전용(치마)이 빠지고, 여아면 모두 보인다. 로그인 전에는 성별 없이 모두 보인다.
// 남아로 바꿔 골라 둔 카테고리가 보이지 않게 되면 카테고리 거르기를 푼다

const child = (id: number, name: string, gender: 'MALE' | 'FEMALE') => ({
  id,
  name,
  birthDate: '2019-05-01',
  gender,
  heightCm: 118,
  weightKg: 21,
  bodyType: 'NORMAL',
  preferredFit: 'LOOSE',
  growthRecordCount: 1,
  hasOptionalConsent: true,
  lastRecordedAt: null,
})
const KIDS = [child(501, '하준', 'MALE'), child(502, '하윤', 'FEMALE')]

const categoryBar = (page: Page) => page.getByRole('button', { name: '치마', exact: true })
const isCategoryList = (request: Request) =>
  new URL(request.url()).pathname.endsWith('/api/v1/categories')

test('남아를 고르면 치마가 빠지고, 여아를 고르면 보인다', async ({ page }) => {
  const genders: (string | null)[] = []
  page.on('request', (request) => {
    if (isCategoryList(request)) genders.push(new URL(request.url()).searchParams.get('gender'))
  })
  await page.goto('/')
  await expect(categoryBar(page)).toBeVisible()

  await page.route('**/api/v1/children', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: KIDS }) : route.fallback(),
  )
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()

  await page.goto('/?child=501')
  await expect(page.getByRole('button', { name: '바지', exact: true })).toBeVisible()
  await expect(categoryBar(page)).toHaveCount(0)

  await page.goto('/?child=502')
  await expect(categoryBar(page)).toBeVisible()
  expect(genders).toContain(null)
  expect(genders).toContain('MALE')
  expect(genders).toContain('FEMALE')
})

test('여아로 고른 치마 거르기는 남아로 바꾸면 풀린다', async ({ page }) => {
  await page.route('**/api/v1/children', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: KIDS }) : route.fallback(),
  )
  await page.goto('/')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()

  await page.goto('/?child=502&cat=13')
  await expect(categoryBar(page)).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/cat=13/)

  await page.goto('/?child=501&cat=13')
  await expect(page.getByRole('button', { name: '바지', exact: true })).toBeVisible()
  await expect(page).not.toHaveURL(/cat=/)
})
