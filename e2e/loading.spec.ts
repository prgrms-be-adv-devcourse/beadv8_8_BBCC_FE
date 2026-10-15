import { expect, test } from '@playwright/test'

// 로딩 표시: 처음 조회가 오래 걸리면 시연 막대 아래 진행 막대가 보이고, 끝나면 사라진다

test('느린 조회 중에는 진행 막대가 보이고 끝나면 사라진다', async ({ page }) => {
  await page.route('**/api/v1/products/1', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.continue()
  })
  await page.goto('/products/1')
  const bar = page.getByRole('progressbar', { name: '불러오는 중' })
  await expect(bar).toBeVisible()
  await expect(page.getByText('데일리 맨투맨 (상품 A)').first()).toBeVisible()
  await expect(bar).toHaveCount(0)
})
