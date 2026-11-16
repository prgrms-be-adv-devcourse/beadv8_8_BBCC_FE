import { expect, test } from '@playwright/test'

// 쇼핑: 다른 화면으로 가면 맨 위부터 보인다 (앞 화면에서 내린 자리가 남지 않는다)

test('쇼핑 홈: 목록을 내린 채 상품을 누르면 상품 상세가 맨 위부터 보인다', async ({ page }) => {
  await page.goto('/')
  const tile = page.getByRole('region', { name: '전체 상품' }).locator('a[href*="/products/"]')
  await expect(tile.first()).toBeVisible()
  await tile.last().scrollIntoViewIfNeeded()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

  await tile.last().click()

  await expect(page).toHaveURL(/\/products\//)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})
