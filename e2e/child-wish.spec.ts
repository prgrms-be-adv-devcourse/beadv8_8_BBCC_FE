import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { pickOption } from './support/option'

const base = 'http://localhost:18080/api/v1'

/** 보호자로 자녀를 등록하고 자녀 계정을 발급한다. 자녀 상세 화면에 머문다 */
async function registerChildWithAccount(page: Page) {
  await page.goto('/login')
  await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
  await expect(page).toHaveURL('/')
  await page.goto('/my/children/new')
  const name = `아이${Date.now()}`
  await page.getByLabel('이름', { exact: true }).fill(name)
  await page.getByRole('checkbox', { name: /필수 동의/ }).check()
  await page.getByRole('checkbox', { name: /선택 동의/ }).check()
  await page.getByRole('button', { name: '등록하기' }).click()
  await page.getByRole('link', { name: `${name} 상세` }).click()
  await expect(page).toHaveURL(/\/my\/children\/\d+$/)
  const childId = page.url().split('/').at(-1) ?? ''
  const loginId = `c${Date.now()}`
  await page.getByLabel('아이디').fill(loginId)
  await page.getByLabel('비밀번호', { exact: true }).fill('password1')
  await page.getByRole('button', { name: '계정 발급' }).click()
  await expect(page.getByText(`아이디: ${loginId}`)).toBeVisible()
  return { childId, loginId }
}

/** 보호자 토큰 · 자녀 토큰 · 기본 배송지 (API로 조르기를 미리 만들 때) */
async function apiActors(request: APIRequestContext, loginId: string) {
  const token = await request.post(`${base}/dev/tokens`, {
    data: { memberId: 1, roles: ['BUYER'] },
  })
  const guardian = { authorization: `Bearer ${(await token.json()).accessToken}` }
  const login = await request.post(`${base}/auth/child/login`, {
    data: { loginId, password: 'password1' },
  })
  const child = { authorization: `Bearer ${(await login.json()).accessToken}` }
  const address = await request.post(`${base}/members/me/addresses`, {
    headers: guardian,
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
  return { guardian, child, addressId: String((await address.json()).id) }
}

/** 자녀 토큰으로 장바구니에 담고 그 칸들로 조르기를 보낸다 (BE #998 · #999) */
async function sendWish(
  request: APIRequestContext,
  child: Record<string, string>,
  lines: { optionId: number; quantity: number }[],
  message: string | null,
) {
  const cartItemIds: number[] = []
  for (const line of lines) {
    const added = await request.post(`${base}/cart/items`, {
      headers: child,
      data: { ...line, childId: null },
    })
    expect(added.status()).toBe(201)
    cartItemIds.push(Number((await added.json()).cartItemId))
  }
  const sent = await request.post(`${base}/wish/requests`, {
    headers: child,
    data: { cartItemIds, message },
  })
  expect(sent.status()).toBe(201)
  return (await sent.json()).requestId as string
}

async function loginChild(page: Page, loginId: string) {
  await page.goto('/child')
  await page.getByLabel('아이디').fill(loginId)
  await page.getByLabel('비밀번호').fill('password1')
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await page.getByRole('button', { name: '확인', exact: true }).click()
}

test('보호자가 받은 조르기를 확인하고 예약 칸으로 일부만 승인(주문)한다', async ({
  page,
  request,
}) => {
  const { childId, loginId } = await registerChildWithAccount(page)
  const { child, addressId } = await apiActors(request, loginId)
  await sendWish(
    request,
    child,
    [
      { optionId: 1, quantity: 2 },
      { optionId: 2, quantity: 1 },
    ],
    '부탁해요',
  )
  await page.reload()
  await page.getByRole('link', { name: '받은 조르기 (1)' }).click()
  await page.getByRole('link', { name: /대기/ }).click()
  await expect(page.getByText('부탁해요')).toBeVisible()
  await expect(page.getByText(/· 2개$/)).toBeVisible()
  await expect(page.getByText('조르기 보냄', { exact: false })).toBeVisible()
  const decide = page.getByRole('heading', { name: '조르기 답하기' }).locator('..')
  const approve = decide.getByRole('button', { name: '승인하고 결제' })
  await decide.getByRole('checkbox').first().check()
  await decide.getByLabel('배송지').selectOption(addressId)
  // 예약 칸은 조른 수량보다 많이 살 수 없다
  await decide.getByRole('spinbutton').first().fill('3')
  await expect(approve).toBeDisabled()
  await decide.getByRole('spinbutton').first().fill('1')
  await expect(approve).toBeEnabled()
  // 결제를 처리하지 않게 해 공용 보호자 잔액을 쓰지 않는다 (주문 생성까지가 이 테스트의 범위)
  await request.post(`${base}/__fake/payment-stall`, { data: {} })
  const placed = page.waitForRequest(
    (req) => req.method() === 'POST' && new URL(req.url()).pathname === '/api/v1/orders',
  )
  await approve.click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('예치금에서')
  await dialog.getByRole('button', { name: '승인' }).click()
  await expect(page).toHaveURL(/\/orders\/\d+$/)
  const body = (await placed).postDataJSON() as {
    items: { optionId: number; childId: number; quantity: number; cartItemId: number }[]
  }
  expect(body.items).toEqual([
    expect.objectContaining({ optionId: 1, childId: Number(childId), quantity: 1 }),
  ])
  expect(typeof body.items[0].cartItemId).toBe('number')
})

test('보호자가 조르기를 거절하면 자녀가 이유를 본다', async ({ page, context, request }) => {
  const { childId, loginId } = await registerChildWithAccount(page)
  const { child } = await apiActors(request, loginId)
  const requestId = await sendWish(request, child, [{ optionId: 3, quantity: 1 }], null)
  await page.goto(`/my/children/${childId}/wishes/${requestId}`)
  await page.getByLabel('거절 사유').selectOption('NEXT_TIME')
  await page.getByRole('button', { name: '거절', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: '거절' }).click()
  await expect(page.getByRole('heading', { name: '조르기 답하기' })).toHaveCount(0)
  await expect(page.getByText('거절 사유: 다음에 사자')).toBeVisible()
  await page.getByRole('link', { name: '받은 조르기', exact: true }).click()
  await expect(page.getByRole('link', { name: /거절/ })).toBeVisible()
  const childPage = await context.newPage()
  await loginChild(childPage, loginId)
  await childPage.goto('/child/wishes')
  await expect(childPage.getByRole('main')).toContainText('거절')
  await expect(childPage.getByRole('main')).toContainText('다음에 사자')
  // 거절하면 예약이 풀려 다시 조를 수 있다
  await childPage.goto('/child/cart')
  await expect(childPage.getByRole('button', { name: '빼기' })).toBeEnabled()
  await expect(childPage.getByText('진행 중인 조르기에 담겨 있어요.')).toHaveCount(0)
})

test('이미 처리된 조르기를 승인하면 조르기를 다시 불러온다', async ({ page, request }) => {
  const { childId, loginId } = await registerChildWithAccount(page)
  const { guardian, child } = await apiActors(request, loginId)
  const requestId = await sendWish(request, child, [{ optionId: 1, quantity: 1 }], null)
  await page.goto(`/my/children/${childId}/wishes/${requestId}`)
  const decide = page.getByRole('heading', { name: '조르기 답하기' }).locator('..')
  await decide.getByRole('checkbox').first().check()
  // 화면을 연 사이에 다른 곳에서 먼저 거절했다 → 예약이 풀린 칸은 주문할 수 없다(403)
  const rejected = await request.post(`${base}/wish/requests/${requestId}/rejection`, {
    headers: guardian,
    data: { reason: 'OTHER' },
  })
  expect(rejected.status()).toBe(200)
  await decide.getByRole('button', { name: '승인하고 결제' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: '승인' }).click()
  await expect(page.getByRole('heading', { name: '조르기 답하기' })).toHaveCount(0)
  await expect(page.getByText(/^거절 · 완료/)).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`/wishes/${requestId}$`))
})

test('자녀가 상품을 담고 합친 뒤 뺀다', async ({ page, context }) => {
  const { loginId } = await registerChildWithAccount(page)
  const child = await context.newPage()
  await loginChild(child, loginId)
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
  const { loginId } = await registerChildWithAccount(page)
  const child = await context.newPage()
  // 자녀 영역이 부르면 안 되는 보호자 회원 API (보호자 로그인 표시용 /members/me는 제외).
  // 장바구니(/cart)는 BE #998부터 자녀 토큰으로 자기 장바구니를 쓰므로 뺀다
  const memberCalls: string[] = []
  child.on('request', (request) => {
    const { pathname } = new URL(request.url())
    if (/^\/api\/v1\/(children|recommendations|members\/me\/.+)(\/|$)/.test(pathname))
      memberCalls.push(`${request.method()} ${pathname}`)
  })
  await loginChild(child, loginId)
  await child.getByRole('link', { name: '상품', exact: true }).click()
  await child.locator('a[href="/child/products/1"]').first().click()
  await pickOption(child, '네이비', '110')
  await child.getByRole('button', { name: '내 장바구니에 담기' }).click()
  await child.getByRole('link', { name: '내 장바구니 보기' }).click()
  await expect(child.getByRole('button', { name: '빼기' })).toBeVisible()
  expect(memberCalls).toEqual([])
})

test('자녀가 조르고 보호자가 일부 승인하거나 거절한다', async ({ page, context, request }) => {
  const { childId, loginId } = await registerChildWithAccount(page)
  const { addressId } = await apiActors(request, loginId)
  const child = await context.newPage()
  await loginChild(child, loginId)
  await child.goto('/child/products/1')
  await pickOption(child, '네이비', '110')
  await child.getByRole('button', { name: '내 장바구니에 담기' }).click()
  await child.getByRole('button', { name: '내 장바구니에 담기' }).click()
  await pickOption(child, '네이비', '120')
  await child.getByRole('button', { name: '내 장바구니에 담기' }).click()
  await child.goto('/child/cart')
  const cart = child.getByRole('main')
  await cart.getByRole('checkbox').first().check()
  await cart.getByRole('checkbox').nth(1).check()
  await child.getByLabel('메시지').fill('첫 번째 부탁')
  await child.getByRole('button', { name: '조르기 보내기' }).click()
  await expect(child.getByText('보냈어요.', { exact: false })).toBeVisible()
  await expect(cart.getByRole('checkbox').first()).toBeDisabled()
  await child.getByRole('link', { name: '내 조르기 보기' }).click()
  await expect(child.getByRole('main')).toContainText('대기')
  await child.goto('/child/products/2')
  await pickOption(child, '그레이', '120')
  await child.getByRole('button', { name: '내 장바구니에 담기' }).click()
  await child.goto('/child/cart')
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
  await decide.getByLabel('배송지').selectOption(addressId)
  // 결제를 처리하지 않게 해 공용 보호자 잔액을 쓰지 않는다 (주문 생성까지가 이 테스트의 범위)
  await request.post(`${base}/__fake/payment-stall`, { data: {} })
  await decide.getByRole('button', { name: '승인하고 결제' }).click()
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
  // 승인 = 결제: 결제가 끝나기 전에는 승인한 조르기도 대기다
  await child.goto('/child/wishes')
  await expect(child.getByRole('main')).toContainText('대기')
  await expect(child.getByRole('main')).toContainText('거절')
  await expect(child.getByRole('main')).toContainText('다음에 사자')
  // 거절한 조르기의 상품은 예약이 풀려 다시 조를 수 있다
  await child.goto('/child/cart')
  await expect(cart.getByText('진행 중인 조르기에 담겨 있어요.')).toHaveCount(2)
  await cart.getByRole('checkbox', { name: /밴딩 조거 팬츠/ }).check()
  await child.getByLabel('메시지').fill('다시 부탁')
  await child.getByRole('button', { name: '조르기 보내기' }).click()
  await expect(child.getByText('보냈어요.', { exact: false })).toBeVisible()
})

test('자녀가 대기 중인 조르기를 철회하면 예약이 풀리고 보호자도 철회됨으로 본다', async ({
  page,
  context,
  request,
}) => {
  const { childId, loginId } = await registerChildWithAccount(page)
  const { child } = await apiActors(request, loginId)
  const requestId = await sendWish(request, child, [{ optionId: 3, quantity: 1 }], '철회할 조르기')
  const childPage = await context.newPage()
  await loginChild(childPage, loginId)
  await childPage.goto('/child/wishes')
  const card = childPage.getByRole('article').filter({ hasText: '철회할 조르기' })
  await expect(card).toContainText('7일 남음')
  await card.getByRole('button', { name: '철회' }).click()
  await childPage.getByRole('alertdialog').getByRole('button', { name: '철회하기' }).click()
  await expect(card).toContainText('철회됨')
  await expect(card.getByRole('button', { name: '철회' })).toHaveCount(0)
  // 예약이 풀려 장바구니에서 뺄 수 있다
  await childPage.goto('/child/cart')
  await expect(childPage.getByRole('button', { name: '빼기' })).toBeEnabled()
  // 보호자 화면도 철회됨
  await page.goto(`/my/children/${childId}/wishes/${requestId}`)
  await expect(page.getByRole('main')).toContainText('철회됨')
  await expect(page.getByRole('heading', { name: '조르기 답하기' })).toHaveCount(0)
})

test('자녀가 나를 위해 산 것에서 조르기로 산 상품을 본다', async ({ page, context, request }) => {
  const { childId, loginId } = await registerChildWithAccount(page)
  const { guardian, child } = await apiActors(request, loginId)
  const requestId = await sendWish(request, child, [{ optionId: 3, quantity: 1 }], null)
  const wish = await request
    .get(`${base}/wish/requests/${requestId}`, { headers: child })
    .then((res) => res.json())
  const line = wish.items[0]
  await request.post(`${base}/wallets/me/charges/confirm`, {
    headers: guardian,
    data: { orderId: `child-purchase-${Date.now()}`, amount: line.unitPrice, paymentKey: 'e2e' },
  })
  const placed = await request
    .post(`${base}/orders`, {
      headers: guardian,
      data: {
        items: [
          {
            optionId: Number(line.optionId),
            childId: Number(childId),
            quantity: 1,
            unitPrice: line.unitPrice,
            cartItemId: Number(line.cartItemId),
          },
        ],
        shippingAddress: {
          recipientName: '부모',
          phone: '010-0000-0000',
          zipCode: '04524',
          address: '서울시',
        },
      },
    })
    .then((res) => res.json())
  await expect(async () => {
    const order = await request
      .get(`${base}/orders/${placed.orderId}`, { headers: guardian })
      .then((res) => res.json())
    expect(order.status).toBe('PAID')
  }).toPass({ timeout: 10_000 })

  const childPage = await context.newPage()
  await loginChild(childPage, loginId)
  await childPage.getByRole('link', { name: '나를 위해 산 것' }).click()
  await expect(childPage).toHaveURL(/\/child\/purchases$/)
  const card = childPage.getByRole('article').first()
  await expect(card).toContainText(line.productName)
  await expect(card).toContainText('결제 완료')
  await expect(card).toContainText('조르기로 산 것')
})
