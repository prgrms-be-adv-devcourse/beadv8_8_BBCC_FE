import { expect, test, type Page } from '@playwright/test'

// 사이즈 추천 근거 (BE #1162): AI가 고르면 추천 한 줄 바로 아래에 근거(종류 라벨 + 문구)를 보이고, 규칙이면 숨긴다.
// AI는 규칙 후보 밖의 실제 사이즈를 고를 수 있다 (recommendedSize가 candidateSizes에 없음).
// AI 근거 아래에는 AI 안내를 달고, 이 상품 구분(상품 A = 상의)의 기준 옷이 없으면 등록 안내와 기준 옷 칸 링크를 둔다.
// 기준 옷이 있으면 추천 한 줄 아래에 추천 사이즈의 기준 핏(기준 옷과 cm 차이 · AI 항목 판단)을 보인다 (BE #1261).
// 추천 사이즈의 입을 수 있는 기간과 성장 속도를 예상치로 보이고, ⓘ를 누르면 출처와 안내를 연다 (BE #1266)

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
  referenceFit: null,
  itemJudgements: [],
  wearPreview: null,
  growthSpeed: {
    cmPerMonth: 0.55,
    recentCmPerMonth: null,
    recordCount: 0,
    recordMonths: 0,
    childSharePercent: 0,
    tableCmPerMonth: 0.55,
    tableSource: '한국아동패널',
  },
  wearablePeriods: [
    { size: '110', lengthMonths: 0, widthMonths: null, months: 0 },
    { size: '120', lengthMonths: 9, widthMonths: null, months: 9 },
  ],
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

test('기준 옷이 있으면 추천 사이즈의 기준 핏을 추천 한 줄 아래에 보이고, 모르는 실측 코드는 숨긴다', async ({
  page,
}) => {
  const diff = (code: string, diffCm: number) => ({
    code,
    garmentCm: 35,
    sizes: [
      { size: '110', productCm: 33, diffCm: -2 },
      { size: '120', productCm: 35 + diffCm, diffCm },
    ],
  })
  await openDetail(
    page,
    size({
      source: 'AI',
      reasons: [
        { type: 'MEASUREMENT', detail: '가슴이 지금 옷보다 조금 넉넉해요.', sourceId: null },
      ],
      referenceFit: {
        productPart: 'TOP',
        comparedPart: 'TOP',
        items: [diff('TOTAL_LENGTH', 2), diff('CHEST_WIDTH', 1.5), diff('MYSTERY_CODE', 3)],
      },
      itemJudgements: [
        { code: 'CHEST_WIDTH', diffCm: 1.5, fit: 'PROPER', allowanceMinCm: 1, allowanceMaxCm: 4 },
      ],
    }),
    [{ part: 'TOP', categoryId: '11', measurements: { TOTAL_LENGTH: 44, CHEST_WIDTH: 35 } }],
  )

  await expect(page.getByText('지금 입는 상의보다')).toBeVisible()
  const compared = page.getByRole('list', { name: '기준 옷과 비교' })
  await expect(compared.getByRole('listitem')).toHaveText([
    '총장 +2.0cm',
    '가슴단면 +1.5cm · 여유 적당',
  ])
  await expect(page.getByText('MYSTERY_CODE')).toHaveCount(0)
})

test('추천 사이즈의 입을 수 있는 기간과 성장 속도를 예상치로 보이고, ⓘ로 출처와 안내를 연다', async ({
  page,
}) => {
  await openDetail(
    page,
    size({
      growthSpeed: {
        cmPerMonth: 0.62,
        recentCmPerMonth: 0.7,
        recordCount: 3,
        recordMonths: 3.46,
        childSharePercent: 40,
        tableCmPerMonth: 0.55,
        tableSource: '한국아동패널',
      },
    }),
  )

  await expect(page.getByText('약 9개월 더 입을 수 있을 것으로 예상해요')).toBeVisible()
  await expect(
    page.getByText('우리 아이 기록과 또래 평균으로 보면 한 달에 약 0.6cm씩 클 것으로 예상해요'),
  ).toBeVisible()

  // ⓘ: 누르면 열리고 Esc로 닫힌다 (휴대폰은 눌러서 연다)
  const tip = page.getByRole('button', { name: '성장 속도 안내' })
  await expect(tip).toHaveAttribute('aria-expanded', 'false')
  await tip.click()
  await expect(tip).toHaveAttribute('aria-expanded', 'true')
  const note = page.getByRole('note')
  await expect(note).toContainText('또래 평균은 한국아동패널 자료로 계산했어요')
  await expect(note).toContainText('우리 아이 성장 기록 3회(3.5개월)를 함께 반영했어요')
  await expect(note).toContainText('아이마다 크는 속도가 달라 실제와 다를 수 있어요.')
  await page.keyboard.press('Escape')
  await expect(note).toHaveCount(0)

  // 마우스를 올려도 열린다
  await page.getByText('추천 사이즈', { exact: true }).hover()
  await tip.hover()
  await expect(page.getByRole('note')).toBeVisible()
})

test('성장이 0.0cm로 반올림되면 기간 줄을 숨기고 키가 거의 그대로라고 안내한다', async ({
  page,
}) => {
  await openDetail(
    page,
    size({
      growthSpeed: {
        cmPerMonth: 0.04,
        recentCmPerMonth: null,
        recordCount: 4,
        recordMonths: 5,
        childSharePercent: 100,
        tableCmPerMonth: 0.55,
        tableSource: '한국아동패널',
      },
      wearablePeriods: [{ size: '120', lengthMonths: 24, widthMonths: null, months: 24 }],
    }),
  )

  await expect(page.getByText('최근 기록으로는 키가 거의 그대로예요')).toBeVisible()
  await expect(page.getByText(/입을 수 있을 것으로 예상해요/)).toHaveCount(0)
  await page.getByRole('button', { name: '성장 속도 안내' }).click()
  await expect(page.getByRole('note')).toContainText(
    '또래 평균은 한 달에 약 0.6cm예요. 키를 잰 날짜와 값이 맞는지 확인해 보세요.',
  )
})
