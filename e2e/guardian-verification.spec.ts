import { expect, test } from '@playwright/test'

test('미인증 보호자는 본인인증 뒤 자녀를 등록할 수 있다', async ({ page, request }) => {
  await page.addInitScript(() => {
    Object.assign(window, { PortOne: { requestIdentityVerification: async () => ({}) } })
  })
  await page.goto('/login')
  await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
  await request.post('http://localhost:18080/api/v1/__fake/unverify-guardian', {
    data: { memberId: 1 },
  })
  await page.goto('/my/children/new')
  await expect(page.getByText('처음 한 번 보호자 본인인증이 필요해요.')).toBeVisible()
  await expect(page.getByLabel('이름', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '휴대폰 본인인증' }).click()
  await expect(page.getByLabel('이름', { exact: true })).toBeVisible()
})
