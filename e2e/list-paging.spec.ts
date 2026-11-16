import { expect, test, type Page } from '@playwright/test'
import { signInAdmin } from './support/admin'

// 목록 페이지 이동 (갭 G26): 요청에 page를 싣고 주소 ?page=(0부터)에 남긴다. 가짜 백엔드 자료가 적어
// 응답의 totalPages만 3으로 늘려 페이지 번호가 보이게 한다 (자료는 가짜 백엔드 그대로)
async function pretendThreePages(page: Page, path: string) {
  const requested: number[] = []
  await page.route(
    (url) => url.pathname.endsWith(`/api/v1${path}`),
    async (route) => {
      const response = await route.fetch()
      const body = await response.json()
      const number = Number(new URL(route.request().url()).searchParams.get('page') ?? 0)
      requested.push(number)
      await route.fulfill({ response, json: { ...body, page: number, totalPages: 3 } })
    },
  )
  return requested
}

test('관리자 회원 목록: 다음 페이지를 부르고, 구분 탭을 바꾸면 첫 페이지로', async ({ page }) => {
  const requested = await pretendThreePages(page, '/admin/members')
  await signInAdmin(page)
  await page.goto('/admin/members?filter=BUYER')
  const list = page.getByRole('region', { name: '회원 목록' })
  const pages = list.getByRole('navigation', { name: '페이지' })
  await expect(pages.getByRole('button', { name: '1페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  const next = page.waitForRequest((request) =>
    /\/admin\/members\?.*filter=BUYER.*page=1/.test(request.url()),
  )
  await pages.getByRole('button', { name: '2페이지' }).click()
  await next
  await expect(page).toHaveURL(/[?&]page=1(&|$)/)
  await expect(pages.getByRole('button', { name: '2페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  const firstOfSellers = page.waitForRequest((request) =>
    /\/admin\/members\?.*filter=SELLER.*page=0/.test(request.url()),
  )
  await page.getByRole('tab', { name: '판매자' }).click()
  await firstOfSellers
  await expect(page).not.toHaveURL(/[?&]page=/)
  expect(requested).toContain(1)
})

test('관리자 판매자 신청: 심사 대기 표 아래 페이지 번호로 다음 페이지', async ({ page }) => {
  await pretendThreePages(page, '/admin/seller-applications')
  await signInAdmin(page)
  await page.goto('/admin/seller-applications')
  const pending = page.getByRole('region', { name: '심사 대기' })
  const next = page.waitForRequest((request) =>
    /\/admin\/seller-applications\?.*status=PENDING.*page=1/.test(request.url()),
  )
  await pending.getByRole('button', { name: '2페이지' }).click()
  await next
  await expect(page).toHaveURL(/[?&]page=1(&|$)/)
})

test('판매자 정산: 정산 예정 · 정산서 표가 각자 페이지를 넘긴다', async ({ page }) => {
  await pretendThreePages(page, '/seller/settlement-targets')
  await pretendThreePages(page, '/seller/settlements')
  await page.goto('/center')
  await page.getByRole('button', { name: '판매자', exact: true }).first().click()
  await page.goto('/center/settlements')
  const targets = page.getByRole('region', { name: '정산 예정' })
  const nextTargets = page.waitForRequest((request) =>
    /\/seller\/settlement-targets\?.*page=2/.test(request.url()),
  )
  await targets.getByRole('button', { name: '3페이지' }).click()
  await nextTargets
  await expect(page).toHaveURL(/[?&]page=2(&|$)/)
  const settlements = page.getByRole('region', { name: '정산서 목록' })
  const nextSettlements = page.waitForRequest((request) =>
    /\/seller\/settlements\?.*page=1/.test(request.url()),
  )
  await settlements.getByRole('button', { name: '2페이지' }).click()
  await nextSettlements
  await expect(page).toHaveURL(/settlementPage=1/)
  await expect(page).toHaveURL(/[?&]page=2(&|$)/)
})
