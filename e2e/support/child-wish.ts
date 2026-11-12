import { expect, type APIRequestContext, type Page } from '@playwright/test'

// 자녀 조르기 E2E가 같이 쓰는 준비 단계 (가짜 백엔드)
export const base = 'http://localhost:18080/api/v1'

/** 보호자로 자녀를 등록하고 자녀 계정을 발급한다. 자녀 상세 화면에 머문다 */
export async function registerChildWithAccount(page: Page) {
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
export async function apiActors(request: APIRequestContext, loginId: string) {
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
export async function sendWish(
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

export async function loginChild(page: Page, loginId: string) {
  await page.goto('/child')
  await page.getByLabel('아이디').fill(loginId)
  await page.getByLabel('비밀번호').fill('password1')
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await page.getByRole('button', { name: '확인', exact: true }).click()
}
