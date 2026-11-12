import { expect, test } from '@playwright/test'
import { signInAdmin } from './support/admin'

// 백엔드: 신청한 회원이 탈퇴하면 닉네임 · 사업자등록번호를 비우고, 승인은 409 APPLICANT_WITHDRAWN으로 막는다 (거절은 된다)
test('탈퇴한 회원의 판매자 신청은 승인 버튼을 막고 거절은 할 수 있다', async ({ page }) => {
  await page.route('**/api/v1/admin/seller-applications?*', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    await route.fulfill({
      response,
      json: {
        ...body,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        content: [
          {
            id: 8201,
            businessName: '탈퇴신청상점',
            applicantId: 8201,
            applicantNickname: null,
            maskedBusinessRegistrationNumber: null,
            status: 'PENDING',
            createdAt: '2026-11-11T10:00:00',
          },
        ],
      },
    })
  })
  await signInAdmin(page)
  await page.goto('/admin/seller-applications')
  const row = page.getByRole('region', { name: '심사 대기' }).getByRole('row', {
    name: /탈퇴신청상점/,
  })
  await expect(row).toContainText('탈퇴한 회원')
  await expect(row).toContainText('탈퇴로 삭제됨')
  await expect(row).not.toContainText('null')
  await expect(row.getByRole('button', { name: '승인' })).toBeDisabled()
  await expect(row).toContainText('탈퇴한 회원이라 승인할 수 없어요')
  await expect(row.getByRole('button', { name: '거절' })).toBeEnabled()
})
