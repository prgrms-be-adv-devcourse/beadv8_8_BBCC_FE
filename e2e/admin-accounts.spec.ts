import { expect, test } from '@playwright/test'
import { ADMIN_LOGIN, signInAdmin } from './support/admin'

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

// 관리자 계정: 추가한 관리자가 목록 맨 위에 보이고, 비활성화하면 상태가 바뀐다. 내 계정은 비활성화할 수 없다
test('관리자 계정: 추가 → 목록에 보임 → 비활성화 → 상태 바뀜', async ({ page }) => {
  const email = `e2e-disable-${Date.now()}@kidly.test`
  await signInAdmin(page)
  await page
    .getByRole('navigation', { name: '관리자 메뉴' })
    .getByRole('link', { name: '관리자 계정' })
    .click()

  const table = page.getByRole('table', { name: '관리자' })
  const mine = table.getByRole('row').filter({ hasText: ADMIN_LOGIN.email })
  await expect(mine).toContainText('내 계정')
  await expect(mine.getByRole('button', { name: '비활성화' })).toHaveCount(0)

  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill('password-12345')
  await page.getByRole('button', { name: '관리자 추가' }).click()
  const row = table.getByRole('row').filter({ hasText: email })
  await expect(row.getByRole('cell', { name: '활성', exact: true })).toBeVisible()

  await row.getByRole('button', { name: '비활성화' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: '비활성화' }).click()
  await expect(row.getByRole('cell', { name: '비활성', exact: true })).toBeVisible()
  await expect(row.getByRole('button', { name: '비활성화' })).toHaveCount(0)
})
