import { expect, test } from '@playwright/test'

// 구매자 상품 상세: 상품명 바로 위에 「[상점 아이콘] 판매자 {상호명}」. 상호명이 없으면 줄을 숨긴다

test('상품 상세: 상품명 위에 판매자 상호명을 보인다', async ({ page }) => {
  await page.goto('/products/2')
  const seller = page.getByText('판매자 테스트상점', { exact: true })
  await expect(seller).toBeVisible()
  await expect(seller.locator('..').locator('svg')).toBeVisible()
  // 판매자 줄은 상품명 바로 위
  const sellerBox = await seller.boundingBox()
  const titleBox = await page.getByRole('heading', { level: 1 }).boundingBox()
  expect(sellerBox!.y).toBeLessThan(titleBox!.y)
})

test('상품 상세: 판매자 상호명이 없으면 판매자 줄을 숨긴다', async ({ page }) => {
  await page.route('**/api/v1/products/2', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    await route.fulfill({ response, json: { ...body, businessName: null } })
  })
  await page.goto('/products/2')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('판매자 테스트상점', { exact: true })).toHaveCount(0)
})
