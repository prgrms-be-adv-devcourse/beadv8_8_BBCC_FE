import { expect, test, type Page, type Route } from '@playwright/test'

// 쇼핑 홈: 위 「자녀에게 맞는 옷」(맛보기 4개 + 더보기)과 아래 「전체 상품」(페이지 번호)을 나눈다.
// 맞춤 목록 화면은 탭(전체 + 말단 카테고리)과 「더 보기」로 다음 페이지를 이어 붙인다.
// 개수를 정해 두려고 자녀 · 맞춤 목록 · 상품 목록 응답을 바꿔 본다

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
  lastRecordedAt: null,
}

const item = (n: number) => ({
  productId: String(9000 + n),
  name: `맞춤 상품 ${n}`,
  thumbnailUrl: null,
  businessName: '테스트상점',
  minPrice: 20000 + n,
  recommendedSize: '120',
})

/** 맞춤 목록: 전체 25개, 상의(11)는 3개. 요청의 page · size로 자른다 */
async function fulfillRecommended(route: Route) {
  const url = new URL(route.request().url())
  const categoryId = url.searchParams.get('categoryId')
  const page = Number(url.searchParams.get('page') ?? 0)
  const size = Number(url.searchParams.get('size') ?? 20)
  const all = Array.from({ length: categoryId === '11' ? 3 : 25 }, (_, i) => item(i + 1))
  await route.fulfill({
    json: {
      content: all.slice(page * size, (page + 1) * size),
      page,
      size,
      totalElements: all.length,
      totalPages: Math.ceil(all.length / size),
      hasNext: (page + 1) * size < all.length,
    },
  })
}

async function asParentWithChild(page: Page) {
  await page.route('**/api/v1/children', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: [CHILD] }) : route.fallback(),
  )
  await page.route('**/api/v1/children/501', (route) => route.fulfill({ json: CHILD }))
  await page.route(
    (url) => url.pathname.endsWith('/children/501/recommended-products'),
    fulfillRecommended,
  )
  await page.goto('/')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
}

test('홈 맞춤 영역 4개 → 더보기 → 맞춤 목록 탭 · 더 보기', async ({ page }) => {
  await asParentWithChild(page)
  const recommended = page.getByRole('region', { name: '맞춤 상품' })
  await expect(recommended.getByRole('heading', { name: /하윤에게 맞는 옷/ })).toBeVisible()
  await expect(recommended.getByText(/^맞춤 상품 \d+$/)).toHaveCount(4)
  await expect(recommended.getByText('120 잘 맞아요').first()).toBeVisible()

  await recommended.getByRole('link', { name: /더보기/ }).click()
  await expect(page).toHaveURL(/\/recommended\/501$/)
  await expect(page.getByRole('heading', { name: /하윤에게 맞는 옷/ })).toBeVisible()
  await expect(page.getByText('키 118cm · 체형 보통 · 핏 여유')).toBeVisible()

  // 처음 20개 → 「더 보기」로 21 ~ 25를 이어 붙이고, 더 없으면 버튼이 사라진다
  const names = page.getByText(/^맞춤 상품 \d+$/)
  await expect(names).toHaveCount(20)
  await page.getByRole('button', { name: '더 보기' }).click()
  await expect(names).toHaveCount(25)
  await expect(page.getByRole('button', { name: '더 보기' })).toHaveCount(0)

  // 상의 탭: categoryId=11로 다시 부른다
  const requested = page.waitForRequest((request) =>
    request.url().includes('recommended-products?categoryId=11'),
  )
  await page.getByRole('tab', { name: '상의' }).click()
  await requested
  await expect(page.getByRole('tab', { name: '상의' })).toHaveAttribute('aria-selected', 'true')
  await expect(names).toHaveCount(3)
})

test('홈 전체 상품: 페이지 번호로 다음 페이지를 부르고 주소에 남긴다', async ({ page }) => {
  await page.route(
    (url) => url.pathname.endsWith('/api/v1/products'),
    async (route) => {
      const response = await route.fetch()
      const body = await response.json()
      const number = Number(new URL(route.request().url()).searchParams.get('page') ?? 0)
      await route.fulfill({ response, json: { ...body, page: number, totalPages: 3 } })
    },
  )
  await page.goto('/')
  const list = page.getByRole('region', { name: '전체 상품' })
  const pages = list.getByRole('navigation', { name: '페이지' })
  await expect(pages.getByRole('button', { name: '1페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  const requested = page.waitForRequest((request) => /\/products\?.*page=1/.test(request.url()))
  await pages.getByRole('button', { name: '2페이지' }).click()
  await requested
  await expect(page).toHaveURL(/[?&]page=2/)
  await expect(pages.getByRole('button', { name: '2페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  // 카테고리를 바꾸면 첫 페이지로 돌아간다
  await page.getByRole('button', { name: '상의', exact: true }).click()
  await expect(page).not.toHaveURL(/[?&]page=/)
})
