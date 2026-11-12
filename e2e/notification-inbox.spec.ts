import { expect, test } from '@playwright/test'

test('보호자 알림함: 누르면 읽음, 모두 읽음이면 머리말 배지가 사라진다', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
  await expect(page).toHaveURL('/')
  const [unread] = await Promise.all([
    page.waitForResponse((response) => response.url().includes('/notifications/unread-count')),
    page.goto('/notifications'),
  ])
  const { count } = (await unread.json()) as { count: number }
  const main = page.getByRole('main')
  const welcome = main.getByRole('button', { name: /Kidly에 오신 걸 환영해요/ })
  await expect(welcome).toBeVisible()
  const readAll = main.getByRole('button', { name: '모두 읽음' })
  // 가짜 백엔드를 다시 쓰면 앞 실행이 이미 읽었을 수 있다: 안 읽은 알림이 있을 때만 배지 · 읽음을 확인한다
  if (count > 0) {
    await expect(page.getByRole('link', { name: /^알림 \d+개 안 읽음$/ })).toBeVisible()
    await welcome.click()
    await expect(welcome).not.toContainText('안 읽음')
    if (count > 1) await readAll.click()
  }
  await expect(readAll).toBeDisabled()
  await expect(page.getByRole('link', { name: '알림', exact: true })).toBeVisible()
})
