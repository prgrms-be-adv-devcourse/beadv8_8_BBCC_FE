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

  await test.step('목 데이터를 끄면 바로 새로고침되어 적용되고, 다시 켜도 같다', async () => {
    await Promise.all([
      page.waitForEvent('load'),
      settingCard(page, '목 데이터').getByRole('button', { name: '끄기' }).click(),
    ])
    await expect(settingCard(page, '목 데이터').getByText('꺼짐')).toBeVisible()
    // 새로고침으로 화면에 적용됐으므로 안내가 없다
    await expect(page.getByText('바꾼 설정은 새로고침하면 이 화면에 적용돼요.')).toHaveCount(0)
    await Promise.all([
      page.waitForEvent('load'),
      settingCard(page, '목 데이터').getByRole('button', { name: '켜기' }).click(),
    ])
    await expect(settingCard(page, '목 데이터').getByText('켜짐')).toBeVisible()
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

  await test.step('시연 기능을 끄면 바로 새로고침되어 시연 계정은 로그아웃되고, 역할 전환이 없다', async () => {
    await settingCard(page, '시연 기능').getByRole('button', { name: '끄기' }).click()
    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('alertdialog').getByRole('button', { name: '끄기' }).click(),
    ])
    // 시연 계정(개발용 토큰)은 시연을 끄면 다시 받지 않는다 → 로그아웃 상태로 관리자 로그인 안내
    await expect(page.getByText('관리자 계정으로 볼 수 있는 화면이에요.')).toBeVisible()
    await expect(page.getByRole('button', { name: '보호자', exact: true })).toHaveCount(0)
  })

  await test.step('다시 켜면(관리자 · API) 새로고침 뒤 역할 전환이 돌아온다', async () => {
    await restoreSettings()
    await page.reload()
    await expect(page.getByRole('button', { name: '보호자', exact: true }).first()).toBeVisible()
  })

  expect(pageErrors).toEqual([])
})
