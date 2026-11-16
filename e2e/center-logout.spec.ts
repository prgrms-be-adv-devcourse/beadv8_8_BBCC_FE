import { expect, test } from '@playwright/test'

// 판매자 센터 머리말 로그아웃: 시연 기능을 끈 배포는 시연 막대가 없어서, 판매자 센터에서는 머리말에서 로그아웃한다
test('판매자 센터 머리말에서 로그아웃한다', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '판매자', exact: true }).first().click()
  await expect(page.getByText('테스트상점 · 회원 2')).toBeVisible()

  await page.goto('/center')
  const header = page.locator('[data-area="center"] header')
  await header.getByRole('button', { name: '로그아웃' }).click()

  await expect(page.getByText('로그인 전')).toBeVisible()
  await expect(header.getByRole('button', { name: '로그아웃' })).toHaveCount(0)
})
