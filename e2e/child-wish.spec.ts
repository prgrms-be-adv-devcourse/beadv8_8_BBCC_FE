import { expect, test } from '@playwright/test'

test('부모가 보낸 조르기를 목록과 상세에서 확인한다', async ({ page, request }) => {
  await page.goto('/login')
  await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/my/children/new')
  const name = `아이${Date.now()}`
  await page.getByLabel('이름').fill(name)
  await page.getByRole('button', { name: '등록하기' }).click()
  await page.getByRole('link', { name: `${name} 상세` }).click()
  await expect(page).toHaveURL(/\/my\/children\/\d+$/)
  const childId = page.url().split('/').at(-1)
  const base = 'http://localhost:18080/api/v1'
  const token = await request.post(`${base}/dev/tokens`, {
    data: { memberId: 1, roles: ['BUYER'] },
  })
  const headers = { authorization: `Bearer ${(await token.json()).accessToken}` }
  const item = await request.post(`${base}/wish/items`, {
    headers,
    data: { childId: Number(childId), optionId: 1, quantity: 2 },
  })
  expect(item.status()).toBe(201)
  const sent = await request.post(`${base}/wish/requests`, {
    headers,
    data: {
      childId: Number(childId),
      wishItemIds: [Number((await item.json()).wishItemId)],
      message: '부탁해요',
    },
  })
  expect(sent.status()).toBe(201)
  await page.reload()
  await page.getByRole('link', { name: '받은 조르기 (1)' }).click()
  await page.getByRole('link', { name: /대기/ }).click()
  await expect(page.getByText('부탁해요')).toBeVisible()
  await expect(page.getByText(/2개/)).toBeVisible()
  await expect(page.getByText('조르기 보냄', { exact: false })).toBeVisible()
})
