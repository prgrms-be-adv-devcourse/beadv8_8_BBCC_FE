import { expect, test, type Page } from '@playwright/test'
import { signInAdmin } from './support/admin'

// 결제 · 예치금 목록은 서버 페이지다: 가짜 백엔드 응답의 쪽 수만 늘려 페이지 번호로 다음 쪽을 부르는지 본다

/** path 목록 응답을 요청한 page 그대로, 전체 3쪽으로 바꾼다 */
async function threePagesOf(page: Page, path: string) {
  await page.route(
    (url) => url.pathname.endsWith(`/api/v1${path}`),
    async (route) => {
      const response = await route.fetch()
      const body = await response.json()
      const number = Number(new URL(route.request().url()).searchParams.get('page') ?? 0)
      await route.fulfill({
        response,
        json: { ...body, page: number, totalPages: 3, hasNext: number < 2 },
      })
    },
  )
}

const requestOf = (page: Page, path: string, number: number) =>
  page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname.endsWith(`/api/v1${path}`) &&
      new URL(request.url()).searchParams.get('page') === String(number),
  )

async function goToSecondPage(page: Page, region: string, path: string) {
  const pages = page
    .getByRole('region', { name: region })
    .getByRole('navigation', { name: '페이지' })
  await expect(pages.getByRole('button', { name: '1페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  const requested = requestOf(page, path, 1)
  await pages.getByRole('button', { name: '2페이지' }).click()
  await requested
  await expect(pages.getByRole('button', { name: '2페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
}

test('관리자 전체 결제: 페이지 번호로 다음 쪽을 부른다', async ({ page }) => {
  await threePagesOf(page, '/admin/payments')
  await signInAdmin(page)
  await page.goto('/admin/payments')
  await goToSecondPage(page, '결제 목록', '/admin/payments')
})

test('예치금 이용 내역 · 충전 내역: 탭마다 따로 페이지를 넘긴다', async ({ page }) => {
  await threePagesOf(page, '/wallets/me/ledgers')
  await threePagesOf(page, '/wallets/me/charges')
  await page.goto('/login')
  await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/my/wallet/history')
  await goToSecondPage(page, '이용 내역 목록', '/wallets/me/ledgers')

  await page.getByRole('tab', { name: '충전 내역' }).click()
  await goToSecondPage(page, '충전 내역 목록', '/wallets/me/charges')

  // 이용 내역 탭으로 돌아오면 보던 쪽 그대로다
  await page.getByRole('tab', { name: '이용 내역' }).click()
  await expect(
    page.getByRole('region', { name: '이용 내역 목록' }).getByRole('button', { name: '2페이지' }),
  ).toHaveAttribute('aria-current', 'page')
})
