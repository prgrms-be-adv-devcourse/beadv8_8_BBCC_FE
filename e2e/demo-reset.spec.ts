import { expect, test } from '@playwright/test'
import { acceptConfirms } from './support/confirm'

// 시연 초기화: 탭에 쌓인 시연 기록(목 저장소 · 흐름 기록)을 지우고 콘솔 홈을 새로 불러온다. 시연 역할 로그인은 남는다

test('시연 초기화: 탭 시연 기록을 지우고 로그인은 유지', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await acceptConfirms(page)

  await page.goto('/console')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
  await page.goto('/console/products')
  await expect(page.getByText('데일리 맨투맨 (상품 A)').first()).toBeVisible()
  // 목 저장소 한 칸을 흉내 내고, 흐름 기록이 쌓인 것을 본다
  await page.evaluate(() => sessionStorage.setItem('kidly.mock.e2e-sample', '[1]'))
  const callsBefore = await page.evaluate(
    () => (JSON.parse(sessionStorage.getItem('kidly.api-flow-log') ?? '[]') as unknown[]).length,
  )
  expect(callsBefore).toBeGreaterThan(0)

  await page.goto('/console')
  await page.getByRole('button', { name: '시연 초기화' }).click()
  await expect(page).toHaveURL(/\/console$/)
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
  const flowCalls = await page.evaluate(
    () => (JSON.parse(sessionStorage.getItem('kidly.api-flow-log') ?? '[]') as unknown[]).length,
  )
  // 새로 불러온 뒤 다시 부른 몇 건(세션 복원 등)만 남는다
  expect(flowCalls).toBeLessThan(callsBefore)
  expect(await page.evaluate(() => sessionStorage.getItem('kidly.mock.e2e-sample'))).toBeNull()
  expect(errors).toEqual([])
})
