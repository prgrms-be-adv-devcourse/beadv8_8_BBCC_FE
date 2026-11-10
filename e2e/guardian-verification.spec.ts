import { expect, test } from '@playwright/test'

const API = 'http://localhost:18080/api/v1'

// 회원 1을 미인증으로 바꾸므로, 테스트가 중간에 실패해도 본인인증을 되돌려 뒤 테스트(자녀 등록 · 자동 시연)에 남기지 않는다
test.afterEach(async ({ request }) => {
  const token = await request
    .post(`${API}/dev/tokens`, { data: { memberId: 1, roles: ['BUYER'] } })
    .then((res) => res.json())
  // 이미 인증했으면 409라 그대로 둔다
  await request.post(`${API}/guardian-verification`, {
    headers: { authorization: `Bearer ${token.accessToken}` },
  })
})

test('미인증 보호자는 본인인증 뒤 자녀를 등록할 수 있다', async ({ page, request }) => {
  await page.addInitScript(() => {
    Object.assign(window, { PortOne: { requestIdentityVerification: async () => ({}) } })
  })
  await page.goto('/login')
  await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
  // 로그인이 끝나기 전에 이동하면 로그인 화면으로 돌아온다
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
  await request.post(`${API}/__fake/unverify-guardian`, { data: { memberId: 1 } })
  await page.goto('/my/children/new')
  await expect(page.getByText('처음 한 번 보호자 본인인증이 필요해요.')).toBeVisible()
  await expect(page.getByLabel('이름', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '휴대폰 본인인증' }).click()
  await expect(page.getByLabel('이름', { exact: true })).toBeVisible()
})
