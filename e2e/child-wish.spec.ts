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
  const address = await request.post(`${base}/members/me/addresses`, {
    headers,
    data: {
      recipientName: '부모',
      recipientPhone: '010-0000-0000',
      zipCode: '04524',
      roadAddress: '서울시 테스트로 1',
      detailAddress: null,
      isDefault: true,
    },
  })
  expect(address.status()).toBe(201)
  const item = await request.post(`${base}/wish/items`, {
    headers,
    data: { childId: Number(childId), optionId: 1, quantity: 2 },
  })
  expect(item.status()).toBe(201)
  const second = await request.post(`${base}/wish/items`, {
    headers,
    data: { childId: Number(childId), optionId: 2, quantity: 1 },
  })
  expect(second.status()).toBe(201)
  const sent = await request.post(`${base}/wish/requests`, {
    headers,
    data: {
      childId: Number(childId),
      wishItemIds: [
        Number((await item.json()).wishItemId),
        Number((await second.json()).wishItemId),
      ],
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
  const decide = page.getByRole('heading', { name: '조르기 답하기' }).locator('..')
  await decide.getByRole('checkbox').first().check()
  await decide.getByRole('spinbutton').first().fill('1')
  await decide.getByLabel('배송지').selectOption(String((await address.json()).id))
  // 결제를 처리하지 않게 해 공용 보호자 잔액을 쓰지 않는다 (주문 생성까지가 이 테스트의 범위)
  await request.post('http://localhost:18080/api/v1/__fake/payment-stall', { data: {} })
  await decide.getByRole('button', { name: '승인하고 주문' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: '승인' }).click()
  await expect(page).toHaveURL(/\/orders\/\d+$/)
  const approved = await request.get(`${base}/wish/requests/${(await sent.json()).requestId}`, {
    headers,
  })
  const approvedItems = (await approved.json()).items as { approvedQuantity: number | null }[]
  expect(approvedItems.map((line) => line.approvedQuantity)).toEqual([1, null])
  const another = await request.post(`${base}/wish/items`, {
    headers,
    data: { childId: Number(childId), optionId: 3, quantity: 1 },
  })
  const rejection = await request.post(`${base}/wish/requests`, {
    headers,
    data: {
      childId: Number(childId),
      wishItemIds: [Number((await another.json()).wishItemId)],
      message: null,
    },
  })
  expect(rejection.status()).toBe(201)
  await page.goto(`/my/children/${childId}/wishes/${(await rejection.json()).requestId}`)
  await page.getByLabel('거절 사유').selectOption('NEXT_TIME')
  await page.getByRole('button', { name: '거절', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: '거절' }).click()
  await page.getByRole('link', { name: '받은 조르기', exact: true }).click()
  await expect(page.getByRole('link', { name: /거절/ })).toBeVisible()
})

test('이미 처리된 조르기를 승인하면 조르기를 다시 불러온다', async ({ page, request }) => {
  await page.goto('/login')
  await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/my/children/new')
  const name = `아이${Date.now()}`
  await page.getByLabel('이름').fill(name)
  await page.getByRole('button', { name: '등록하기' }).click()
  await page.getByRole('link', { name: `${name} 상세` }).click()
  await expect(page).toHaveURL(/\/my\/children\/\d+$/)
  const childId = Number(page.url().split('/').at(-1))
  const base = 'http://localhost:18080/api/v1'
  const token = await request.post(`${base}/dev/tokens`, {
    data: { memberId: 1, roles: ['BUYER'] },
  })
  const headers = { authorization: `Bearer ${(await token.json()).accessToken}` }
  await request.post(`${base}/members/me/addresses`, {
    headers,
    data: {
      recipientName: '부모',
      recipientPhone: '010-0000-0000',
      zipCode: '04524',
      roadAddress: '서울시 테스트로 1',
      detailAddress: null,
      isDefault: true,
    },
  })
  const item = await request.post(`${base}/wish/items`, {
    headers,
    data: { childId, optionId: 1, quantity: 1 },
  })
  const sent = await request.post(`${base}/wish/requests`, {
    headers,
    data: { childId, wishItemIds: [Number((await item.json()).wishItemId)], message: null },
  })
  const requestId = (await sent.json()).requestId
  await page.goto(`/my/children/${childId}/wishes/${requestId}`)
  const decide = page.getByRole('heading', { name: '조르기 답하기' }).locator('..')
  await decide.getByRole('checkbox').first().check()
  // 화면을 연 사이에 다른 곳에서 먼저 거절했다
  const rejected = await request.post(`${base}/wish/requests/${requestId}/rejection`, {
    headers,
    data: { reason: 'OTHER' },
  })
  expect(rejected.status()).toBe(200)
  await decide.getByRole('button', { name: '승인하고 주문' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: '승인' }).click()
  await expect(page.getByRole('heading', { name: '조르기 답하기' })).toHaveCount(0)
  await expect(page.getByText(/^거절 · 완료/)).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`/wishes/${requestId}$`))
})
