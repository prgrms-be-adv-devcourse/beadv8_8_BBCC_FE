import { expect, test } from '@playwright/test'

// 쇼핑 홈 카테고리 동그라미: 기본 카테고리는 아이콘, 아이콘이 없는 카테고리는 첫 글자

test('쇼핑 홈: 기본 카테고리는 아이콘, 새 카테고리는 첫 글자로 보인다', async ({ page }) => {
  await page.route('**/api/v1/categories', async (route) => {
    const response = await route.fetch()
    const tree = await response.json()
    const extra = { categoryId: '999', name: '신발', leaf: true, children: [] }
    await route.fulfill({ response, json: [...tree, extra] })
  })
  await page.goto('/')
  for (const name of ['전체 카테고리', '상의', '하의']) {
    await expect(page.getByRole('button', { name, exact: true }).locator('svg')).toBeVisible()
  }
  const shoes = page.getByRole('button', { name: '신발', exact: true })
  await expect(shoes.locator('svg')).toHaveCount(0)
  await expect(shoes).toContainText('신')
})
