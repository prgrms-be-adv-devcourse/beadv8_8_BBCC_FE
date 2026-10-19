import { expect, test, type Page } from '@playwright/test'

// 관리자 설정: 목 데이터 · 시연 기능(역할 전환 · 시연 콘솔 · API 흐름)을 끄고 켠다. 바꾼 값은 새로고침하면 화면에 적용된다.
// 다른 E2E가 목 · 시연을 켠 상태를 전제하므로, 끝나면(실패해도) 가짜 백엔드 설정을 되돌린다

const FAKE_BACKEND = 'http://localhost:18080/api/v1'

async function restoreSettings() {
  const token = await fetch(`${FAKE_BACKEND}/dev/tokens`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ memberId: 3, roles: ['ADMIN'] }),
  }).then((response) => response.json() as Promise<{ accessToken: string }>)
  await fetch(`${FAKE_BACKEND}/admin/settings`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token.accessToken}` },
    body: JSON.stringify({ useMock: true, demoRoleSwitch: true }),
  })
}

function settingCard(page: Page, title: string) {
  return page.locator('[data-slot="card"]').filter({ hasText: title })
}

test.afterEach(restoreSettings)

test('관리자 설정: 목 데이터 · 시연 기능 끄고 켜기 (새로고침하면 적용)', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await test.step('관리자로 설정 화면에 들어간다', async () => {
    await page.goto('/console')
    await page.getByRole('button', { name: '관리자', exact: true }).first().click()
    await expect(page.getByText('관리자 · 회원 3')).toBeVisible()
    await page.goto('/admin/settings')
    await expect(page.getByRole('heading', { name: '설정' })).toBeVisible()
    await expect(settingCard(page, '목 데이터').getByText('켜짐')).toBeVisible()
    await expect(settingCard(page, '시연 기능').getByText('켜짐')).toBeVisible()
  })

  await test.step('목 데이터를 끄고 켜면 새로고침 없이 바로 적용된다', async () => {
    let reloads = 0
    page.on('load', () => reloads++)
    await settingCard(page, '목 데이터').getByRole('button', { name: '끄기' }).click()
    await expect(settingCard(page, '목 데이터').getByText('꺼짐')).toBeVisible()
    await settingCard(page, '목 데이터').getByRole('button', { name: '켜기' }).click()
    await expect(settingCard(page, '목 데이터').getByText('켜짐')).toBeVisible()
    await expect(page.getByText('바꾼 설정은 새로고침하면 이 화면에 적용돼요.')).toHaveCount(0)
    expect(reloads).toBe(0)
  })

  await test.step('시연 기능 끄기는 확인 창에서 취소하면 그대로다', async () => {
    await settingCard(page, '시연 기능').getByRole('button', { name: '끄기' }).click()
    const dialog = page.getByRole('alertdialog')
    // 시연 계정으로 로그인해 있으므로 다시 켜지 못할 수 있다고 경고한다
    await expect(
      dialog.getByText('카카오로 로그인한 관리자만 다시 켤 수 있어요.', { exact: false }),
    ).toBeVisible()
    await dialog.getByRole('button', { name: '취소' }).click()
    await expect(settingCard(page, '시연 기능').getByText('켜짐')).toBeVisible()
  })

  await test.step('시연 기능을 끄면 새로고침 없이 로그아웃되고 로그인 화면으로 간다 (역할 전환 없음)', async () => {
    await settingCard(page, '시연 기능').getByRole('button', { name: '끄기' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: '끄기' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByText('시연용 로그인', { exact: false })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '보호자', exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: '시연 콘솔' })).toHaveCount(0)
  })

  await test.step('다시 켜면(관리자 · API) 새로고침 뒤 역할 전환이 돌아온다', async () => {
    await restoreSettings()
    await page.reload()
    await expect(page.getByRole('button', { name: '보호자', exact: true }).first()).toBeVisible()
  })

  expect(pageErrors).toEqual([])
})
