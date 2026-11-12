import { expect, test } from '@playwright/test'

// 상품 상세 하트: 로그인 전에는 찜 수와 로그인 링크, 보호자는 찜하기 · 찜 취소로 찜 수가 바뀐다
test('상품 상세 하트: 비로그인은 로그인 링크, 보호자는 찜하기 → 찜 수 +1 → 찜 취소', async ({
  page,
}) => {
  await page.goto('/products/1')
  await expect(page.getByRole('heading', { name: '데일리 맨투맨 (상품 A)' })).toBeVisible()
  const loginLink = page.getByRole('link', { name: /^로그인하고 찜하기/ })
  await expect(loginLink).toBeVisible()
  await expect(loginLink).toHaveAttribute('href', /\/login/)

  await page.goto('/')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
  await page.goto('/products/1')

  const unfavorited = page.getByRole('button', { name: '찜하기', exact: true })
  const favorited = page.getByRole('button', { name: '찜 취소', exact: true })
  // 앞 테스트가 찜해 둔 채라도 같은 시작점에서 본다
  await expect(unfavorited.or(favorited)).toBeVisible()
  if (await favorited.isVisible()) {
    await favorited.click()
    await expect(unfavorited).toBeEnabled()
  }
  const before = Number(await unfavorited.innerText())

  await unfavorited.click()
  await expect(favorited).toHaveAttribute('aria-pressed', 'true')
  await expect(favorited).toHaveText(String(before + 1))

  await favorited.click()
  await expect(unfavorited).toHaveAttribute('aria-pressed', 'false')
  await expect(unfavorited).toHaveText(String(before))
})

test('내 찜: 마이페이지 메뉴에서 열고, 판매 상태 배지를 보고, 찜 취소하면 목록에서 빠진다', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
  await page.goto('/products/1')
  const unfavorited = page.getByRole('button', { name: '찜하기', exact: true })
  const favorited = page.getByRole('button', { name: '찜 취소', exact: true })
  await expect(unfavorited.or(favorited)).toBeVisible()
  if (await unfavorited.isVisible()) await unfavorited.click()
  await expect(favorited).toHaveAttribute('aria-pressed', 'true')

  await page.goto('/my')
  await page.getByRole('link', { name: '내 찜', exact: true }).click()
  await expect(page.getByRole('heading', { name: '내 찜' })).toBeVisible()
  const list = page.getByRole('list', { name: '찜한 상품' })
  const row = list.getByRole('listitem').filter({ hasText: '데일리 맨투맨 (상품 A)' })
  await expect(row.getByText('판매 중', { exact: true })).toBeVisible()

  await row.getByRole('button', { name: '찜 취소' }).click()
  await expect(row).toHaveCount(0)
})

test('판매 종료(409)는 서버 문구를 알리고 하트를 되돌린다', async ({ page }) => {
  await page.route('**/api/v1/favorites/1', (route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          json: {
            type: 'about:blank',
            title: '판매가 끝난 상품입니다',
            status: 409,
            detail: '판매가 끝난 상품은 새로 찜할 수 없습니다.',
            instance: '/api/v1/favorites/1',
          },
        })
      : route.fallback(),
  )
  await page.goto('/')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
  await page.goto('/products/1')

  const unfavorited = page.getByRole('button', { name: '찜하기', exact: true })
  const favorited = page.getByRole('button', { name: '찜 취소', exact: true })
  await expect(unfavorited.or(favorited)).toBeVisible()
  if (await favorited.isVisible()) {
    await favorited.click()
    await expect(unfavorited).toBeEnabled()
  }
  await unfavorited.click()
  await expect(page.getByText('판매가 끝난 상품은 새로 찜할 수 없습니다.')).toBeVisible()
  await expect(unfavorited).toHaveAttribute('aria-pressed', 'false')
})

test('상품 목록: 한 쪽의 찜 여부를 한 번에 부르고, 칸의 하트로 찜하면 상세에도 찜으로 보인다', async ({
  page,
}) => {
  const favoriteLookups: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.endsWith('/api/v1/favorites') && url.searchParams.has('productIds'))
      favoriteLookups.push(url.searchParams.get('productIds') ?? '')
  })
  await page.goto('/')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
  favoriteLookups.length = 0
  await page.goto('/')

  const tile = page.locator('div.relative').filter({
    has: page.getByRole('link', { name: /데일리 맨투맨 \(상품 A\)/ }),
  })
  const unfavorited = tile.getByRole('button', { name: '찜하기', exact: true })
  const favorited = tile.getByRole('button', { name: '찜 취소', exact: true })
  await expect(unfavorited.or(favorited)).toBeVisible()
  await page.waitForLoadState('networkidle')
  // 상품마다가 아니라 한 쪽에 한 번
  expect(favoriteLookups).toHaveLength(1)
  expect(favoriteLookups[0].split(',')).toContain('1')
  if (await favorited.isVisible()) {
    await favorited.click()
    await expect(unfavorited).toBeEnabled()
  }

  await unfavorited.click()
  await expect(favorited).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/products/1')
  await expect(page.getByRole('button', { name: '찜 취소', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '찜 취소', exact: true }).click()
  await expect(page.getByRole('button', { name: '찜하기', exact: true })).toBeVisible()
})
