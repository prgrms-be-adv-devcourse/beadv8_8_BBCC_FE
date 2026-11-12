import { expect, test } from '@playwright/test'
import { signInAdmin } from './support/admin'

// 관리자 계정: 새 관리자를 추가하고 결과를 본다. 같은 이메일로 다시 만들면 겹친다는 안내가 나온다
test('관리자 계정: 짧은 비밀번호 안내 → 추가 → 같은 이메일은 겹침 안내', async ({ page }) => {
  // 가짜 백엔드를 다른 테스트와 같이 쓰므로 실행마다 다른 이메일을 쓴다
  const email = `e2e-${Date.now()}@kidly.test`
  await signInAdmin(page)
  await page
    .getByRole('navigation', { name: '관리자 메뉴' })
    .getByRole('link', { name: '관리자 계정' })
    .click()
  await expect(page.getByRole('heading', { name: '관리자 계정', level: 1 })).toBeVisible()

  const submit = page.getByRole('button', { name: '관리자 추가' })
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill('short-pass')
  await submit.click()
  await expect(page.getByText('비밀번호는 12자 이상 입력해 주세요.')).toBeVisible()

  await page.getByLabel('비밀번호').fill('password-12345')
  await submit.click()
  const created = page.getByRole('region', { name: '추가한 관리자' })
  await expect(created).toContainText(email)
  await expect(page.getByLabel('이메일')).toHaveValue('')

  await page.getByLabel('이메일').fill(email.toUpperCase())
  await page.getByLabel('비밀번호').fill('password-12345')
  await submit.click()
  await expect(
    page.getByText('이미 등록된 이메일이에요. 다른 이메일을 입력해 주세요.'),
  ).toBeVisible()
})
