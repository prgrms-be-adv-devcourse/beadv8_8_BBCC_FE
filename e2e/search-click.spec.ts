import { expect, test } from '@playwright/test'

// 검색: 검색어가 있으면 기본 정렬이 관련도순이고(고를 수 있는 것도 이때만), 최신순을 고르면 주소에 남는다.
// 로그인 회원이 검색 결과를 누르면 검색어 · 상품 · 순위 · 정렬을 기록한다 (POST /search/clicks).
// 자녀가 없는 보호자라 자녀 없이 기록한다 (자녀를 싣는 경우는 search-child)
const API = 'http://localhost:18080/api/v1'

test('검색: 관련도순 기본 정렬과 검색 결과 클릭 기록', async ({ page, request }) => {
  const token = await request
    .post(`${API}/dev/tokens`, { data: { memberId: 2, roles: ['BUYER', 'SELLER'] } })
    .then((res) => res.json())
  const auth = { authorization: `Bearer ${token.accessToken}` }
  const name = `검색확인${Date.now()}`
  const registered = await request
    .post(`${API}/seller/products`, {
      headers: auth,
      data: {
        categoryId: 11,
        name,
        brand: null,
        description: null,
        thumbnailUrl: null,
        imageUrls: [],
        attributes: [],
        options: [{ valueIds: [101, 202], initialQuantity: 5, skuCode: null }],
        prices: [{ valueIds: [101, 202], price: 15000 }],
        sizeSpecs: [{ sizeValueId: 202, minHeightCm: 105, maxHeightCm: 115, measurements: {} }],
      },
    })
    .then((res) => res.json())
  const productId = registered.productId as string
  await request.put(`${API}/seller/products/${productId}/sale-status`, {
    headers: auth,
    data: { status: 'ON_SALE' },
  })

  // 앞 테스트가 가짜 백엔드에 자녀를 남겨도 자녀 없는 보호자로 본다
  await page.route('**/api/v1/children', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: [] }) : route.fallback(),
  )
  await page.goto('/')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()

  // 검색어가 없으면 관련도순은 고를 수 없다
  const sort = page.getByRole('combobox', { name: '정렬' })
  await expect(sort).toHaveValue('NEWEST')
  await expect(sort.locator('option', { hasText: '관련도순' })).toHaveCount(0)

  const listing = page.waitForRequest(
    (req) => req.url().includes('/api/v1/products?') && req.url().includes('sort=RELEVANCE'),
  )
  await page.goto(`/?q=${encodeURIComponent(name)}`)
  await listing
  await expect(sort).toHaveValue('RELEVANCE')

  // 최신순을 고르면 주소에 남고, 관련도순으로 돌아오면 주소에서 빠진다
  await sort.selectOption('NEWEST')
  await expect(page).toHaveURL(/sort=NEWEST/)
  await sort.selectOption('RELEVANCE')
  await expect(page).not.toHaveURL(/sort=/)

  const clicked = page.waitForRequest(
    (req) => req.method() === 'POST' && req.url().endsWith('/search/clicks'),
  )
  await page.getByRole('link', { name: new RegExp(name) }).click()
  expect((await clicked).postDataJSON()).toEqual({
    keyword: name,
    productId: Number(productId),
    rank: 1,
    sort: 'RELEVANCE',
  })
  await expect(page).toHaveURL(new RegExp(`/products/${productId}`))
})
