import { expect, test, type Page } from '@playwright/test'

// 사이즈 추천 근거 (BE #1162): AI가 고르면 추천 한 줄 바로 아래에 근거(종류 라벨 + 문구)를 보이고, 규칙이면 숨긴다.
// AI는 규칙 후보 밖의 실제 사이즈를 고를 수 있다 (recommendedSize가 candidateSizes에 없음).
// AI 근거 아래에는 AI 안내를 달고, 이 상품 구분(상품 A = 상의)의 기준 옷이 없으면 등록 안내와 기준 옷 칸 링크를 둔다

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

const size = (overrides: object) => ({
  productId: '1',
  childId: '501',
  recommendedSize: '120',
  fit: 'PROPER',
  notices: [],
  candidateSizes: ['110', '120'],
  lastPurchasedSize: null,
  source: 'RULE',
  reasons: [],
  ...overrides,
})

const AI_NOTICE = 'AI를 활용한 문장이라 실수가 있을 수 있어요.'
const GARMENT_HINT = '잘 맞는 옷을 등록하면 더 정확해요'

async function openDetail(page: Page, sizeResponse: object, garments: object[] = []) {
  await page.route('**/api/v1/children', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: [CHILD] }) : route.fallback(),
  )
  await page.route('**/api/v1/children/501', (route) => route.fulfill({ json: CHILD }))
  await page.route('**/api/v1/recommendations/size?*', (route) =>
    route.fulfill({ json: sizeResponse }),
  )
  await page.route('**/api/v1/recommendations/children/501/reference-garments', (route) =>
    route.fulfill({ json: garments }),
  )
  await page.route('**/api/v1/recommendations/companions?*', (route) =>
    route.fulfill({ json: { source: 'RULE', products: [] } }),
  )
  await page.goto('/')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
  await page.goto('/products/1?childId=501')
  await expect(page.getByText('추천 사이즈')).toBeVisible()
}

test('AI가 후보 밖 사이즈를 고르면 그 사이즈와 근거를 추천 한 줄 아래에 보인다', async ({
  page,
}) => {
  await openDetail(
    page,
    size({
      recommendedSize: '130',
      source: 'AI',
      reasons: [
        { type: 'HEIGHT', detail: '키가 빨리 자라 한 치수 크게 골랐어요.', sourceId: null },
        { type: 'PREFERRED_FIT', detail: '여유 있는 핏을 좋아해요.', sourceId: null },
      ],
    }),
  )

  await expect(page.locator('strong', { hasText: /^130$/ })).toBeVisible()
  const reasons = page.getByRole('list', { name: '추천 근거' })
  await expect(reasons.getByRole('listitem')).toHaveCount(2)
  await expect(reasons.getByText('키', { exact: true })).toBeVisible()
  await expect(reasons.getByText('키가 빨리 자라 한 치수 크게 골랐어요.')).toBeVisible()
  await expect(reasons.getByText('선호 핏', { exact: true })).toBeVisible()
  await expect(page.getByText(AI_NOTICE)).toBeVisible()

  // 상의 기준 옷이 없으면 등록을 권하고 자녀 프로필의 기준 옷 칸으로 보낸다
  await expect(page.getByText(GARMENT_HINT)).toBeVisible()
  await page.getByRole('link', { name: '상의 기준 옷 적기' }).click()
  await expect(page).toHaveURL(/\/my\/children\/501#reference-garments$/)
})

test('규칙 추천이면 근거 목록 · AI 안내를 그리지 않고, 상의 기준 옷이 있으면 등록을 권하지 않는다', async ({
  page,
}) => {
  await openDetail(page, size({}), [
    { part: 'TOP', categoryId: '11', measurements: { TOTAL_LENGTH: 45, CHEST_WIDTH: 38 } },
  ])

  await expect(page.getByRole('list', { name: '추천 근거' })).toHaveCount(0)
  await expect(page.getByText(AI_NOTICE)).toHaveCount(0)
  await expect(page.getByText(GARMENT_HINT)).toHaveCount(0)
})
