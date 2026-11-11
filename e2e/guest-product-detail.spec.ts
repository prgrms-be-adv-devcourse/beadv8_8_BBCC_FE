import { expect, test } from '@playwright/test'

// 로그인하지 않은 채 자녀가 붙은 상세 주소(공유 · 북마크한 주소)로 들어와도 상품 본문이 보여야 한다.
// 예전에는 사이즈 추천이 401을 받고 재발급이 거절되면서 쿼리 캐시가 통째로 지워져 상세가 로딩에서 멈췄다
test('비로그인으로 /products/{id}?childId=에 들어가도 상품 본문이 보인다', async ({ page }) => {
  const sizeRequests: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('/recommendations/size'))
      sizeRequests.push(request.url())
  })

  // dev처럼 상품 상세가 사이즈 추천(401 → 재발급 거절)보다 늦게 오게 한다
  await page.route('**/api/v1/products/1', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.fallback()
  })

  await page.goto('/products/1?childId=501')

  await expect(page.getByRole('heading', { name: '데일리 맨투맨 (상품 A)' })).toBeVisible()
  await expect(page.getByRole('link', { name: '로그인하고 맞는 사이즈 보기' })).toBeVisible()
  expect(sizeRequests).toEqual([])
})

// 로그인 전에 어떤 요청이 401을 받아 재발급이 거절돼도, 지울 로그인이 없으니 다른 조회(상품 상세)를 지우지 않는다
test('비로그인 중 다른 요청이 401을 받아도 상품 상세 조회는 끝까지 받는다', async ({ page }) => {
  await page.route('**/api/v1/products/1', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.fallback()
  })
  // 상세와 함께 나가는 요청(카테고리) 하나가 401을 받는 경우
  await page.route('**/api/v1/categories', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/problem+json',
      json: {
        type: 'about:blank',
        title: '인증이 필요합니다',
        status: 401,
        detail: '로그인이 필요합니다.',
        instance: '/api/v1/categories',
      },
    }),
  )

  await page.goto('/products/1')

  await expect(page.getByRole('heading', { name: '데일리 맨투맨 (상품 A)' })).toBeVisible()
})
