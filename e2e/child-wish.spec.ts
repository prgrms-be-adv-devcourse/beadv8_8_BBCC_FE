import { expect, test } from '@playwright/test'
import { pickOption } from './support/option'

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

test('자녀가 상품을 담고 합친 뒤 뺀다', async ({ page, context }) => {
  await page.goto('/login')
  await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/my/children/new')
  const name = `아이${Date.now()}`
  await page.getByLabel('이름').fill(name)
  await page.getByRole('button', { name: '등록하기' }).click()
  await page.getByRole('link', { name: `${name} 상세` }).click()
  const loginId = `c${Date.now()}`
  await page.getByLabel('아이디').fill(loginId)
  await page.getByLabel('비밀번호', { exact: true }).fill('password1')
  await page.getByRole('button', { name: '계정 발급' }).click()
  const child = await context.newPage()
  await child.addInitScript(() =>
    localStorage.setItem(
      'kidly.mock-settings',
      JSON.stringify({ '자녀 (첫 로그인)': false, '자녀 장바구니 · 조르기 (가정 계약)': false }),
    ),
  )
  await child.goto('/child')
  await child.getByLabel('아이디').fill(loginId)
  await child.getByLabel('비밀번호').fill('password1')
  await child.getByRole('button', { name: '로그인', exact: true }).click()
  await child.getByRole('button', { name: '확인', exact: true }).click()
  await child.getByRole('link', { name: '상품', exact: true }).click()
  await child.locator('a[href="/child/products/1"]').first().click()
  await pickOption(child, '네이비', '110')
  await child.getByRole('button', { name: '내 장바구니에 담기' }).click()
  await expect(child.getByRole('link', { name: '내 장바구니 보기' })).toBeVisible()
  await child.getByRole('button', { name: '내 장바구니에 담기' }).click()
  await child.getByRole('link', { name: '내 장바구니 보기' }).click()
  await expect(child.getByRole('main')).toContainText('2개')
  await child.getByRole('button', { name: '빼기' }).click()
  await expect(child.getByText('담은 상품이 없어요.')).toBeVisible()
})

test('일반 쇼핑 방문에서 자녀 API를 호출하지 않는다', async ({ page }) => {
  const calls: string[] = []
  page.on('request', (request) => {
    if (/\/api\/v1\/(child|auth\/child)\//.test(request.url())) calls.push(request.url())
  })
  await page.goto('/')
  await page.locator('a[href="/products/1"]').first().click()
  await expect(page.getByRole('spinbutton')).toBeVisible()
  expect(calls).toEqual([])
})

test('자녀 영역에서는 보호자 회원 API를 부르지 않는다', async ({ page, context }) => {
  await page.goto('/login')
  await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/my/children/new')
  const name = `아이${Date.now()}`
  await page.getByLabel('이름').fill(name)
  await page.getByRole('button', { name: '등록하기' }).click()
  await page.getByRole('link', { name: `${name} 상세` }).click()
  const loginId = `c${Date.now()}`
  await page.getByLabel('아이디').fill(loginId)
  await page.getByLabel('비밀번호', { exact: true }).fill('password1')
  await page.getByRole('button', { name: '계정 발급' }).click()
  await expect(page.getByText(`아이디: ${loginId}`)).toBeVisible()
  const child = await context.newPage()
  await child.addInitScript(() =>
    localStorage.setItem(
      'kidly.mock-settings',
      JSON.stringify({ '자녀 (첫 로그인)': false, '자녀 장바구니 · 조르기 (가정 계약)': false }),
    ),
  )
  // 자녀 영역이 부르면 안 되는 보호자 회원 API (보호자 로그인 표시용 /members/me는 제외)
  const memberCalls: string[] = []
  child.on('request', (request) => {
    const { pathname } = new URL(request.url())
    if (/^\/api\/v1\/(children|cart|recommendations|members\/me\/.+)(\/|$)/.test(pathname))
      memberCalls.push(`${request.method()} ${pathname}`)
  })
  await child.goto('/child')
  await child.getByLabel('아이디').fill(loginId)
  await child.getByLabel('비밀번호').fill('password1')
  await child.getByRole('button', { name: '로그인', exact: true }).click()
  await child.getByRole('button', { name: '확인', exact: true }).click()
  await child.getByRole('link', { name: '상품', exact: true }).click()
  await child.locator('a[href="/child/products/1"]').first().click()
  await pickOption(child, '네이비', '110')
  await child.getByRole('button', { name: '내 장바구니에 담기' }).click()
  await child.getByRole('link', { name: '내 장바구니 보기' }).click()
  await expect(child.getByRole('button', { name: '빼기' })).toBeVisible()
  expect(memberCalls).toEqual([])
})

test('자녀가 조르고 보호자가 일부 승인하거나 거절한다', async ({ page, context, request }) => {
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
  const loginId = `c${Date.now()}`
  await page.getByLabel('아이디').fill(loginId)
  await page.getByLabel('비밀번호', { exact: true }).fill('password1')
  await page.getByRole('button', { name: '계정 발급' }).click()
  await expect(page.getByText(`아이디: ${loginId}`)).toBeVisible()
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
  const child = await context.newPage()
  await child.addInitScript(() =>
    localStorage.setItem(
      'kidly.mock-settings',
      JSON.stringify({ '자녀 (첫 로그인)': false, '자녀 장바구니 · 조르기 (가정 계약)': false }),
    ),
  )
  await child.goto('/child')
  await child.getByLabel('아이디').fill(loginId)
  await child.getByLabel('비밀번호').fill('password1')
  await child.getByRole('button', { name: '로그인', exact: true }).click()
  await child.getByRole('button', { name: '확인', exact: true }).click()
  await child.goto('/child/products/1')
  await pickOption(child, '네이비', '110')
  await child.getByRole('button', { name: '내 장바구니에 담기' }).click()
  await child.getByRole('button', { name: '내 장바구니에 담기' }).click()
  await pickOption(child, '네이비', '120')
  await child.getByRole('button', { name: '내 장바구니에 담기' }).click()
  await child.goto('/child/cart')
  await child.getByRole('main').getByRole('checkbox').first().check()
  await child.getByRole('main').getByRole('checkbox').nth(1).check()
  await child.getByLabel('메시지').fill('첫 번째 부탁')
  await child.getByRole('button', { name: '조르기 보내기' }).click()
  await expect(child.getByText('보냈어요.', { exact: false })).toBeVisible()
  await expect(child.getByRole('main').getByRole('checkbox').first()).toBeDisabled()
  await child.getByRole('link', { name: '내 조르기 보기' }).click()
  await expect(child.getByRole('main')).toContainText('대기')
  await child.goto('/child/products/2')
  await pickOption(child, '그레이', '120')
  await child.getByRole('button', { name: '내 장바구니에 담기' }).click()
  await child.goto('/child/cart')
  const cart = child.getByRole('main')
  await expect(cart.getByRole('checkbox', { disabled: true })).toHaveCount(2)
  await expect(cart.getByText('진행 중인 조르기에 담겨 있어요.')).toHaveCount(2)
  await cart.getByRole('checkbox', { disabled: false }).check()
  await child.getByLabel('메시지').fill('두 번째 부탁')
  await child.getByRole('button', { name: '조르기 보내기' }).click()
  await expect(child.getByText('보냈어요.', { exact: false })).toBeVisible()
  await page.goto(`/my/children/${childId}/wishes`)
  await page.getByRole('link', { name: /데일리 맨투맨/ }).click()
  await expect(page.getByText('첫 번째 부탁')).toBeVisible()
  const decide = page.getByRole('heading', { name: '조르기 답하기' }).locator('..')
  await decide.getByRole('checkbox').first().check()
  await decide.getByRole('spinbutton').first().fill('1')
  await decide.getByLabel('배송지').selectOption(String((await address.json()).id))
  // 결제를 처리하지 않게 해 공용 보호자 잔액을 쓰지 않는다 (주문 생성까지가 이 테스트의 범위)
  await request.post(`${base}/__fake/payment-stall`, { data: {} })
  await decide.getByRole('button', { name: '승인하고 주문' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: '승인' }).click()
  await expect(page).toHaveURL(/\/orders\/\d+$/)
  await page.goto(`/my/children/${childId}/wishes`)
  await page.getByRole('link', { name: /밴딩 조거 팬츠/ }).click()
  await expect(page.getByText('두 번째 부탁')).toBeVisible()
  await page.getByLabel('거절 사유').selectOption('NEXT_TIME')
  await page.getByRole('button', { name: '거절', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: '거절' }).click()
  await expect(page.getByRole('heading', { name: '조르기 답하기' })).toHaveCount(0)
  await expect(page.getByText('거절 사유: 다음에 사자')).toBeVisible()
  await page.goto(`/my/children/${childId}/wishes`)
  await page.getByRole('link', { name: /데일리 맨투맨.* 외 1개/ }).click()
  await expect(page.getByText(/· 1개 승인$/)).toBeVisible()
  await expect(page.getByText(/· 제외$/)).toBeVisible()
  await expect(page.getByText(/^답한 시각/)).toBeVisible()
  await child.goto('/child/wishes')
  await expect(child.getByRole('main')).toContainText(/결제 대기|결제 완료/)
  await expect(child.getByRole('main')).toContainText('거절')
  await expect(child.getByRole('main')).toContainText('다음에 사자')
  // 거절한 조르기의 상품과 승인에서 빠진 상품은 잠금이 풀려 다시 조를 수 있다
  await child.goto('/child/cart')
  await expect(cart.getByText('진행 중인 조르기에 담겨 있어요.')).toHaveCount(1)
  await cart.getByRole('checkbox', { name: /밴딩 조거 팬츠/ }).check()
  await child.getByLabel('메시지').fill('다시 부탁')
  await child.getByRole('button', { name: '조르기 보내기' }).click()
  await expect(child.getByText('보냈어요.', { exact: false })).toBeVisible()
})
