import { expect, test } from '@playwright/test'
import { signInAdmin } from './support/admin'

// 관리자 설정: 시연 데이터(목 응답)를 켜고 끈다. 이 브라우저에 기억해 새로고침 뒤에도 그대로다
test('관리자 설정: 시연 데이터 끄기 → 새로고침 뒤에도 꺼짐 → 다시 켜기', async ({ page }) => {
  await signInAdmin(page)
  await page
    .getByRole('navigation', { name: '관리자 메뉴' })
    .getByRole('link', { name: '설정' })
    .click()
  await expect(page.getByRole('heading', { name: '설정', level: 1 })).toBeVisible()

  const demoData = page.getByRole('switch', { name: '시연 데이터' })
  await expect(demoData).toHaveAttribute('aria-checked', 'true')

  await demoData.click()
  await expect(demoData).toHaveAttribute('aria-checked', 'false')

  await page.reload()
  await expect(demoData).toHaveAttribute('aria-checked', 'false')

  await demoData.click()
  await expect(demoData).toHaveAttribute('aria-checked', 'true')
})
