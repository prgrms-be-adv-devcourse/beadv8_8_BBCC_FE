import { expect, test } from '@playwright/test'
import { signInAdmin } from './support/admin'

test('관리자 홈은 서버 필터와 전체 건수로 심사 대기·이용 정지 수를 표시한다', async ({ page }) => {
  await page.route('**/api/v1/admin/seller-applications?*', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    const pending = new URL(route.request().url()).searchParams.get('status') === 'PENDING'
    await route.fulfill({
      response,
      json: {
        ...body,
        totalElements: pending ? 61 : 103,
        totalPages: 6,
        hasNext: true,
        content: [
          {
            id: pending ? 8101 : 8102,
            businessName: '전체건수확인상점',
            applicantId: 8101,
            applicantNickname: '확인회원',
            maskedBusinessRegistrationNumber: '123-**-*****',
            status: pending ? 'PENDING' : 'APPROVED',
            createdAt: '2026-11-11T10:00:00',
          },
        ],
      },
    })
  })
  await page.route('**/api/v1/admin/members?*', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    const suspended = new URL(route.request().url()).searchParams.get('filter') === 'SUSPENDED'
    await route.fulfill({
      response,
      json: {
        ...body,
        totalElements: suspended ? 73 : 109,
        totalPages: 6,
        hasNext: true,
        content: [
          {
            id: 8101,
            nickname: '확인회원',
            email: null,
            status: suspended ? 'SUSPENDED' : 'ACTIVE',
            sellerStatus: null,
            suspendReason: suspended ? '확인용' : null,
            suspendedAt: null,
            createdAt: '2026-11-11T10:00:00',
          },
        ],
      },
    })
  })
  await signInAdmin(page)
  await expect(page.getByRole('link', { name: /심사 대기 판매자 신청/ })).toContainText('61')
  await expect(page.getByRole('link', { name: /이용 정지 회원/ })).toContainText('73')
  await page.getByRole('link', { name: /심사 대기 판매자 신청/ }).click()
  await expect(page.getByRole('region', { name: '심사 대기' }).getByRole('heading')).toContainText(
    '61',
  )
  await expect(
    page.getByRole('region', { name: '처리한 신청' }).getByRole('heading'),
  ).toContainText('42')
})

test('관리자 상품·결제 목록은 현재 페이지 개수 대신 전체 건수를 표시한다', async ({ page }) => {
  for (const [path, total] of [
    ['products', 137],
    ['admin/payments', 149],
  ] as const) {
    await page.route(`**/api/v1/${path}?*`, async (route) => {
      const response = await route.fetch()
      const body = await response.json()
      await route.fulfill({
        response,
        json: {
          ...body,
          totalElements: total,
          totalPages: 8,
          hasNext: true,
        },
      })
    })
  }
  await signInAdmin(page)
  await page.goto('/admin/products')
  await expect(page.getByRole('heading', { name: /판매 중 상품/ })).toContainText('137개')
  await page.goto('/admin/payments')
  await expect(page.getByRole('region', { name: '결제 목록' })).toContainText('149건')
})
