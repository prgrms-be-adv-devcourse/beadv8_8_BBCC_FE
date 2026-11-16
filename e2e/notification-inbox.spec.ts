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

test('다른 탭에서 읽음 처리하면 배지가 주기 조회 없이 바로 바뀐다 (알림 SSE)', async ({
  page,
  context,
}) => {
  await page.goto('/login')
  // 보호자 알림은 위 테스트가 모두 읽으므로, 같은 구매자인 판매자 계정을 쓴다
  const [unread, stream] = await Promise.all([
    page.waitForResponse((response) => response.url().includes('/notifications/unread-count')),
    page.waitForResponse((response) => response.url().includes('/notifications/stream')),
    page.getByRole('main').getByRole('button', { name: '판매자', exact: true }).click(),
  ])
  expect(stream.headers()['content-type']).toContain('text/event-stream')
  const { count } = (await unread.json()) as { count: number }
  test.skip(count === 0, '가짜 백엔드를 다시 써서 앞 실행이 이미 모두 읽었다')
  await expect(page.getByRole('link', { name: `알림 ${count}개 안 읽음` })).toBeVisible()

  let refetched = 0
  page.on('request', (request) => {
    if (request.url().includes('/notifications/unread-count')) refetched++
  })
  // 로그인은 탭 메모리에만 있으므로 다른 탭도 같은 계정으로 로그인한다 (로그인하면 알림함으로 돌아온다)
  const other = await context.newPage()
  await other.goto('/notifications')
  await other.getByRole('main').getByRole('button', { name: '판매자', exact: true }).click()
  await other
    .getByRole('main')
    .getByRole('button', { name: /안 읽음/ })
    .first()
    .click()

  const label = count > 1 ? `알림 ${count - 1}개 안 읽음` : '알림'
  await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible()
  // 기다린 시간이 주기 조회(60초)보다 짧고 다시 조회하지 않았으니, 스트림 이벤트로 바뀐 것이다
  expect(refetched).toBe(0)
})

test('다른 탭에서 읽음 처리하면 열려 있는 알림함 목록도 바로 바뀐다 (알림 SSE)', async ({
  page,
  context,
}) => {
  // 로그인하면 알림함으로 돌아온다. 위 테스트와 같은 판매자 계정의 남은 알림을 쓴다
  await page.goto('/notifications')
  await page.getByRole('main').getByRole('button', { name: '판매자', exact: true }).click()
  // 이동할 곳이 있는 알림은 링크, 없으면 버튼이다
  const unreadItems = page.getByRole('main').getByText('(안 읽음)')
  // 시드 알림(환영)이 보이면 목록을 다 받은 것이다
  await expect(
    page.getByRole('main').getByRole('button', { name: /Kidly에 오신 걸 환영해요/ }),
  ).toBeVisible()
  const before = await unreadItems.count()
  test.skip(before === 0, '가짜 백엔드를 다시 써서 앞 실행이 이미 모두 읽었다')

  const other = await context.newPage()
  await other.goto('/notifications')
  await other.getByRole('main').getByRole('button', { name: '판매자', exact: true }).click()
  // 이 탭은 새로고침하지 않는다: 스트림 이벤트로 목록을 다시 받아야 바뀐다
  await Promise.all([
    page.waitForResponse((response) => /\/notifications\?page=0/.test(response.url())),
    other
      .getByRole('main')
      .getByRole('listitem')
      .filter({ hasText: '(안 읽음)' })
      .first()
      .locator('a, button')
      .first()
      .click(),
  ])
  await expect(unreadItems).toHaveCount(before - 1)
})
