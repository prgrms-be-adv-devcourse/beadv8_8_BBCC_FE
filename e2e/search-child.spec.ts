import { expect, test, type Request } from '@playwright/test'

// 보호자가 검색하면 고른 자녀를 GET /products의 childId로 함께 보낸다 (BE #1089, 검색 기록용).
// 둘러보기(검색어 없음)에는 붙이지 않고, 자녀 목록을 받기 전에 자녀 없는 검색을 먼저 보내지 않는다.
// 검색 결과를 누르면 클릭 기록(POST /search/clicks)에도 같은 자녀를 싣는다

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

const isProductList = (request: Request) =>
  new URL(request.url()).pathname.endsWith('/api/v1/products')

test('보호자 검색에는 고른 자녀 childId가 붙고, 둘러보기에는 붙지 않는다', async ({ page }) => {
  await page.route('**/api/v1/children', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: [CHILD] }) : route.fallback(),
  )
  await page.route('**/api/v1/children/501', (route) => route.fulfill({ json: CHILD }))
  const listRequests: URL[] = []
  page.on('request', (request) => {
    if (isProductList(request)) listRequests.push(new URL(request.url()))
  })

  await page.goto('/')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()

  const searched = page.waitForRequest(
    (request) =>
      isProductList(request) && new URL(request.url()).searchParams.get('keyword') === '조거',
  )
  await page.getByRole('textbox', { name: '상품 검색' }).fill('조거')
  await page.getByRole('button', { name: '검색' }).click()
  expect(new URL((await searched).url()).searchParams.get('childId')).toBe('501')

  const searches = listRequests.filter((url) => url.searchParams.get('keyword') === '조거')
  expect(searches.every((url) => url.searchParams.get('childId') === '501')).toBe(true)
  const browses = listRequests.filter((url) => !url.searchParams.has('keyword'))
  expect(browses.length).toBeGreaterThan(0)
  expect(browses.some((url) => url.searchParams.has('childId'))).toBe(false)

  const clicked = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith('/search/clicks'),
  )
  await page
    .getByRole('link', { name: /밴딩 조거 팬츠/ })
    .first()
    .click()
  expect((await clicked).postDataJSON()).toMatchObject({ keyword: '조거', childId: 501 })
})
