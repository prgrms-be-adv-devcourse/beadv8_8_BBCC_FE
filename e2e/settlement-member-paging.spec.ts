import { expect, test, type Page } from '@playwright/test'
import { signInAdmin } from './support/admin'

// 판매자 정산 · 관리자 회원 · 판매자 신청 목록은 서버 페이지다:
// 가짜 백엔드 응답의 쪽 수만 늘려 페이지 번호로 다음 쪽을 부르는지, 회원 구분을 바꾸면 첫 쪽부터인지 본다

/** path 목록 응답을 요청한 page 그대로, 전체 3쪽으로 바꾼다. totalElements를 주면 그것도 바꾼다 */
async function threePagesOf(
  page: Page,
  path: string,
  totalElementsOf?: (query: URLSearchParams) => number,
) {
  await page.route(
    (url) => url.pathname.endsWith(`/api/v1${path}`),
    async (route) => {
      const response = await route.fetch()
      const body = await response.json()
      const query = new URL(route.request().url()).searchParams
      const number = Number(query.get('page') ?? 0)
      await route.fulfill({
        response,
        json: {
          ...body,
          page: number,
          totalPages: 3,
          hasNext: number < 2,
          ...(totalElementsOf && { totalElements: totalElementsOf(query) }),
        },
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

const pagesOf = (page: Page, region: string) =>
  page.getByRole('region', { name: region }).getByRole('navigation', { name: '페이지' })

async function expectCurrent(page: Page, region: string, number: number) {
  await expect(
    pagesOf(page, region).getByRole('button', { name: `${number}페이지` }),
  ).toHaveAttribute('aria-current', 'page')
}

async function goToSecondPage(page: Page, region: string, path: string) {
  await expectCurrent(page, region, 1)
  const requested = requestOf(page, path, 1)
  await pagesOf(page, region).getByRole('button', { name: '2페이지' }).click()
  await requested
  await expectCurrent(page, region, 2)
}

test('판매자 정산: 정산 예정 · 정산서를 따로 넘긴다', async ({ page }) => {
  await threePagesOf(page, '/seller/settlement-targets')
  await threePagesOf(page, '/seller/settlements')
  await page.goto('/')
  await page.getByRole('button', { name: '판매자', exact: true }).first().click()
  await expect(page.getByText('테스트상점 · 회원 2')).toBeVisible()
  await page.goto('/center/settlements')

  await goToSecondPage(page, '정산서 목록', '/seller/settlements')
  await goToSecondPage(page, '정산 예정', '/seller/settlement-targets')
  // 정산 예정을 넘겨도 정산서는 보던 쪽 그대로다
  await expectCurrent(page, '정산서 목록', 2)
})

test('관리자 회원 목록: 쪽을 넘기고, 구분을 바꾸면 첫 쪽부터', async ({ page }) => {
  await threePagesOf(page, '/admin/members')
  await signInAdmin(page)
  await page.goto('/admin/members')
  await goToSecondPage(page, '회원 목록', '/admin/members')
  await expect(page).toHaveURL(/[?&]page=1(&|$)/)

  const firstOfSellers = page.waitForRequest((request) => {
    const query = new URL(request.url()).searchParams
    return (
      new URL(request.url()).pathname.endsWith('/api/v1/admin/members') &&
      query.get('filter') === 'SELLER' &&
      query.get('page') === '0'
    )
  })
  await page.getByRole('tab', { name: '판매자', exact: true }).click()
  await firstOfSellers
  await expectCurrent(page, '회원 목록', 1)
  await expect(page).not.toHaveURL(/[?&]page=/)
})

test('판매자 신청 심사: 심사 대기 · 처리한 신청을 따로 넘긴다', async ({ page }) => {
  // 처리한 신청 표가 보이도록 전체 건수를 심사 대기보다 크게 둔다
  await threePagesOf(page, '/admin/seller-applications', (query) =>
    query.get('status') === 'PENDING' ? 50 : 100,
  )
  await signInAdmin(page)
  await page.goto('/admin/seller-applications')
  await goToSecondPage(page, '심사 대기', '/admin/seller-applications')
  await goToSecondPage(page, '처리한 신청', '/admin/seller-applications')
  await expectCurrent(page, '심사 대기', 2)
})
