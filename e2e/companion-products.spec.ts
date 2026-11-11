import { expect, test, type Page } from '@playwright/test'

// 상품 상세 맨 아래 「함께 사면 좋은 상품」(BE #1164, SSE FE #290): 자녀를 골랐을 때 상세와 함께 바로 부르고,
// AI 답을 기다리는 동안 카드 칸마다 원형 로딩을 두고, 이유가 없는 카드는 이유 칸을 숨기고,
// 실패(Gateway 504)하거나 함께 볼 상품이 없어도 영역에 안내를 남긴다.
// SSE(BE #1205 · #1211)는 AI 답이면 rule → ai, 저장해 둔 답이면 ai만, 규칙 답이면 rule만 온다
// 상품 설명은 처음에 윗부분만 보이고 「상세정보 펼쳐보기」로 펼친다

const CHILD = {
  id: 501,
  name: '하윤',
  birthDate: '2019-05-01',
  gender: 'FEMALE',
  heightCm: 118,
  weightKg: 21,
  bodyType: 'NORMAL',
  preferredFit: 'LOOSE',
  growthRecordCount: 1,
  hasOptionalConsent: true,
  lastRecordedAt: null,
}

const card = (n: number, reason: string | null) => ({
  productId: String(9100 + n),
  name: `함께 상품 ${n}`,
  thumbnailUrl: null,
  businessName: '테스트상점',
  minPrice: 15000 + n,
  recommendedSize: '120',
  reason,
})

const REASON = '맨투맨과 같은 톤이라 함께 입기 좋아요.'

type Picks = { source: 'AI' | 'RULE'; products: ReturnType<typeof card>[] }

/** SSE 응답 본문 (event · data 한 쌍씩) */
const sse = (...events: [event: 'rule' | 'ai', data: Picks][]) => ({
  contentType: 'text/event-stream',
  body: events
    .map(([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    .join(''),
})

async function asParentWithChild(page: Page) {
  await page.route('**/api/v1/children', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: [CHILD] }) : route.fallback(),
  )
  await page.route('**/api/v1/children/501', (route) => route.fulfill({ json: CHILD }))
  await page.goto('/')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
}

const companionSection = (page: Page) => page.getByRole('region', { name: '함께 사면 좋은 상품' })
const WAITING = '함께 입기 좋은 상품을 고르고 있어요'

/** 흐름 기록(탭 저장)에서 마지막 함께 사면 호출이 받은 이벤트 순서 */
const lastStreamEvents = (page: Page) =>
  page.evaluate(() => {
    const logs = JSON.parse(sessionStorage.getItem('kidly.api-flow-log') ?? '[]') as {
      path: string
      responseBody: { events?: string[] } | null
    }[]
    return logs.findLast((log) => log.path === '/recommendations/companions')?.responseBody?.events
  })

test('자녀를 고르면 함께 사면 좋은 상품을 부르고, 이유가 없는 카드는 이유 칸을 숨긴다', async ({
  page,
}) => {
  await asParentWithChild(page)
  let release = () => {}
  const answered = new Promise<void>((resolve) => (release = resolve))
  const requested: URL[] = []
  const ai: Picks = { source: 'AI', products: [card(1, REASON), card(2, null)] }
  const rule: Picks = { source: 'RULE', products: [card(1, null), card(2, null)] }
  await page.route('**/api/v1/recommendations/companions?*', async (route) => {
    requested.push(new URL(route.request().url()))
    // 처음은 AI를 기다렸다 rule → ai, 다시 물으면 저장해 둔 답처럼 ai만
    if (requested.length > 1) return route.fulfill(sse(['ai', ai]))
    await answered
    await route.fulfill(sse(['rule', rule], ['ai', ai]))
  })

  await page.goto('/products/1?childId=501')
  const section = companionSection(page)
  await expect(section.getByRole('heading', { name: '함께 사면 좋은 상품' })).toBeVisible()
  await expect(section.getByRole('status', { name: WAITING })).toBeVisible()
  release()

  await expect(section.getByRole('link', { name: /함께 상품 1/ })).toBeVisible()
  await expect(section.getByRole('link', { name: /함께 상품 2/ })).toBeVisible()
  await expect(section.getByText(REASON)).toBeVisible()
  await expect(section.getByRole('listitem').nth(1).locator('p.bg-paper-2')).toHaveCount(0)
  expect(requested[0]?.searchParams.get('productId')).toBe('1')
  expect(requested[0]?.searchParams.get('childId')).toBe('501')
  await expect.poll(() => lastStreamEvents(page)).toEqual(['rule', 'ai'])

  // 같은 상세를 다시 열면 저장해 둔 AI 답처럼 ai만 온다
  await page.reload()
  await expect(companionSection(page).getByText(REASON)).toBeVisible()
  await expect.poll(() => lastStreamEvents(page)).toEqual(['ai'])
})

test('AI 없이 규칙 결과만 오고 닫히면 받아 둔 규칙 결과를 그린다', async ({ page }) => {
  await asParentWithChild(page)
  await page.route('**/api/v1/recommendations/companions?*', (route) =>
    route.fulfill(sse(['rule', { source: 'RULE', products: [card(3, null), card(4, null)] }])),
  )

  await page.goto('/products/2?childId=501')

  const section = companionSection(page)
  await expect(section.getByRole('link', { name: /함께 상품 3/ })).toBeVisible()
  await expect(section.getByRole('link', { name: /함께 상품 4/ })).toBeVisible()
  await expect(section.getByRole('status', { name: WAITING })).toHaveCount(0)
  await expect.poll(() => lastStreamEvents(page)).toEqual(['rule'])
})

test('자녀를 고르지 않았으면 부르지 않고, 실패(504)하면 영역에 안내를 남기고 다시 불러온다', async ({
  page,
}) => {
  await asParentWithChild(page)
  let calls = 0
  await page.route('**/api/v1/recommendations/companions?*', (route) => {
    calls += 1
    return calls === 1
      ? route.fulfill({ status: 504, body: 'Gateway Timeout' })
      : route.fulfill(sse(['rule', { source: 'RULE', products: [card(5, null)] }]))
  })

  await page.goto('/products/1')
  await expect(page.getByRole('heading', { name: '데일리 맨투맨 (상품 A)' })).toBeVisible()
  expect(calls).toBe(0)

  await page.goto('/products/1?childId=501')
  await expect.poll(() => calls).toBe(1)
  const section = companionSection(page)
  await expect(section.getByText('지금은 함께 볼 상품을 불러오지 못했어요')).toBeVisible()

  await section.getByRole('button', { name: '다시 불러오기' }).click()
  await expect(section.getByRole('link', { name: /함께 상품 5/ })).toBeVisible()
  expect(calls).toBe(2)
})

test('함께 볼 상품이 없으면 영역에 안내를 남긴다', async ({ page }) => {
  await asParentWithChild(page)
  await page.route('**/api/v1/recommendations/companions?*', (route) =>
    route.fulfill(sse(['rule', { source: 'RULE', products: [] }])),
  )

  await page.goto('/products/1?childId=501')

  const section = companionSection(page)
  await expect(section.getByText('이 상품과 함께 볼 만한 상품이 아직 없어요')).toBeVisible()
  await expect(section.getByRole('button', { name: '다시 불러오기' })).toHaveCount(0)
})

test('긴 상품 설명은 접혀 있다가 「상세정보 펼쳐보기」로 펼친다', async ({ page }) => {
  await page.route('**/api/v1/products/1', async (route) => {
    const response = await route.fetch()
    const json = await response.json()
    await route.fulfill({
      response,
      json: { ...json, description: '부드러운 기모 안감. '.repeat(40) },
    })
  })
  await page.goto('/products/1')

  const toggle = page.getByRole('button', { name: '상세정보 펼쳐보기' })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.click()
  await expect(page.getByRole('button', { name: '상세정보 접기' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
})
