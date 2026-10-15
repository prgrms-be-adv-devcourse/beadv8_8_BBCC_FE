import { expect, test } from '@playwright/test'

// 자동 시연: 버튼 하나로 ①~⑦ (화면 이동 + API 호출). 테스트 속도로 끝까지 가는지, 흐름 패널에 기록이 남는지.
// 파일 이름 zz-: 회원 1을 판매자로 승인하는 등 가짜 백엔드 공용 상태를 바꾸므로 다른 E2E 뒤에 돈다 (파일 이름 순서)

test('자동 시연: 버튼 하나로 정상 흐름 ①~⑦', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/console')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()

  const bar = page.getByRole('region', { name: '자동 시연' })
  await bar.getByRole('combobox', { name: '자동 시연 속도' }).selectOption('test')
  await bar.getByRole('button', { name: '▶ 자동 시연' }).click()

  const status = bar.getByRole('status', { name: '자동 시연 상태' })
  await expect(status).toContainText('자동 시연 끝 · ①~⑦ 통과', { timeout: 90_000 })
  // 마지막 화면은 판매자 정산서, 흐름 패널에 자동 시연 행동이 남는다
  await expect(page).toHaveURL(/\/console\/seller\/settlements$/)
  await expect(page.getByText(/자동 시연 · 정산 실행/).first()).toBeVisible()
  await expect(bar.getByRole('link', { name: '흐름 확인 보기' })).toBeVisible()
  expect(errors).toEqual([])
})
