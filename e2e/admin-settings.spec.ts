import { expect, test, type Page } from '@playwright/test'

// 관리자 설정: 목 데이터 사용을 끄고 켠다. 바꾼 값은 새로고침하면 적용된다.
// 다른 E2E가 목을 켠 상태를 전제하므로, 끝나면(실패해도) 가짜 백엔드 설정을 되돌린다

const FAKE_BACKEND = 'http://localhost:18080/api/v1'
const RELOAD_NOTICE = '바꾼 설정은 새로고침하면 이 화면에 적용돼요.'

async function restoreSettings() {
  const token = await fetch(`${FAKE_BACKEND}/dev/tokens`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ memberId: 3, roles: ['ADMIN'] }),
  }).then((response) => response.json() as Promise<{ accessToken: string }>)
  await fetch(`${FAKE_BACKEND}/admin/settings`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token.accessToken}` },
    body: JSON.stringify({ useMock: true }),
  })
}

function mockCard(page: Page) {
  return page.locator('[data-slot="card"]').filter({ hasText: '목 데이터' })
}

test.afterEach(restoreSettings)

test('관리자 설정: 목 데이터 끄고 켜기 (새로고침하면 적용)', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await test.step('관리자로 설정 화면에 들어간다', async () => {
    await page.goto('/console')
    await page.getByRole('button', { name: '관리자', exact: true }).first().click()
    await expect(page.getByText('관리자 · 회원 3')).toBeVisible()
    await page.goto('/admin/settings')
    await expect(page.getByRole('heading', { name: '설정' })).toBeVisible()
    await expect(mockCard(page).getByText('켜짐')).toBeVisible()
  })

  await test.step('끄면 저장된 값이 바뀌고 새로고침 안내가 나온다, 새로고침하면 적용돼 안내가 사라진다', async () => {
    await mockCard(page).getByRole('button', { name: '끄기' }).click()
    await expect(mockCard(page).getByText('꺼짐')).toBeVisible()
    await expect(page.getByText(RELOAD_NOTICE)).toBeVisible()
    await page.getByRole('button', { name: '새로고침' }).click()
    await expect(mockCard(page).getByText('꺼짐')).toBeVisible()
    await expect(page.getByText(RELOAD_NOTICE)).toHaveCount(0)
  })

  await test.step('다시 켜면 새로고침 안내가 나오고, 새로고침하면 사라진다', async () => {
    await mockCard(page).getByRole('button', { name: '켜기' }).click()
    await expect(mockCard(page).getByText('켜짐')).toBeVisible()
    await expect(page.getByText(RELOAD_NOTICE)).toBeVisible()
    await page.getByRole('button', { name: '새로고침' }).click()
    await expect(mockCard(page).getByText('켜짐')).toBeVisible()
    await expect(page.getByText(RELOAD_NOTICE)).toHaveCount(0)
  })

  expect(pageErrors).toEqual([])
})
