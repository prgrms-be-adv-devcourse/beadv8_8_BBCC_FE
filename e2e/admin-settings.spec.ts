import { expect, test } from '@playwright/test'
import { signInAdmin } from './support/admin'

// 관리자 설정: 시연 데이터(쇼핑 목록 예시 사진)를 켜고 끈다. 이 브라우저에 기억해 새로고침 뒤에도 그대로다
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

// 시연 기능을 끄면 화면 위 시연 막대(API 흐름 버튼)가 사라지고, 새로고침 뒤에도 꺼져 있다
test('관리자 설정: 시연 기능 끄기 → 시연 막대 사라짐 → 새로고침 뒤에도 꺼짐 → 다시 켜기', async ({
  page,
}) => {
  await signInAdmin(page)
  await page.goto('/admin/settings')
  const demoFeatures = page.getByRole('switch', { name: '시연 기능' })
  const flowButton = page.getByRole('button', { name: /^API 흐름/ })
  await expect(demoFeatures).toHaveAttribute('aria-checked', 'true')
  await expect(flowButton).toBeVisible()

  await demoFeatures.click()
  await expect(demoFeatures).toHaveAttribute('aria-checked', 'false')
  await expect(flowButton).toHaveCount(0)

  await page.reload()
  await expect(demoFeatures).toHaveAttribute('aria-checked', 'false')
  await expect(flowButton).toHaveCount(0)

  await demoFeatures.click()
  await expect(demoFeatures).toHaveAttribute('aria-checked', 'true')
  await expect(flowButton).toBeVisible()
})
