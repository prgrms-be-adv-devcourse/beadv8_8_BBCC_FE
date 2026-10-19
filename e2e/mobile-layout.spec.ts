import { expect, test } from '@playwright/test'

// 휴대폰 너비(375px): 쇼핑 화면은 가로로 넘치지 않고, 검색 칸은 머리말 아래 줄에 보인다

for (const [name, url] of [
  ['쇼핑 홈', '/'],
  ['상품 상세', '/products/1'],
]) {
  test(`휴대폰 너비 ${name}: 가로로 넘치지 않는다`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(url)
    const header = page.locator('header')
    await expect(header.getByRole('link', { name: '로그인', exact: true })).toBeInViewport({
      ratio: 1,
    })
    await expect(header.getByLabel('상품 검색')).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
}
