import { expect, test, type Page } from '@playwright/test'
import { holdEventStream } from './support/held-event-stream'

// 상품 칸의 「담기」: 팝업에서 옵션을 고르고 담는다. 추천 사이즈가 있어도 대신 고르지 않는다
const PRODUCT = '데일리 맨투맨 (상품 A)'

test('상품 칸 담기: 로그인 전에는 고른 옵션을 실어 로그인으로 보낸다', async ({ page }) => {
  await page.goto('/')
  const list = page.getByRole('region', { name: '전체 상품' })
  await list.getByRole('button', { name: `${PRODUCT} 담기` }).click()
  const dialog = page.getByRole('dialog', { name: '옵션 고르고 담기' })
  await expect(dialog.getByText(PRODUCT)).toBeVisible()
  // 옵션 가격이 모두 같으면 물결표를 붙이지 않는다
  await expect(dialog.getByText('25,000원', { exact: true })).toBeVisible()

  // 사이즈를 고르기 전에 누르면 안내만 한다
  await dialog.getByRole('button', { name: '로그인하고 담기' }).click()
  await expect(dialog.getByRole('alert')).toHaveText('사이즈를 골라 주세요.')

  const sizes = dialog.getByRole('group', { name: '사이즈', exact: true })
  await sizes.getByRole('button', { name: /^110/ }).click()
  await expect(dialog.getByRole('link', { name: '로그인하고 담기' })).toHaveAttribute(
    'href',
    /\/login.*option/,
  )

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('상품 칸 담기: 보호자는 팝업에서 사이즈를 골라 장바구니에 담는다', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()

  const list = page.getByRole('region', { name: '전체 상품' })
  // 팝업을 열면 상세 진입과 구분되는 조회(QUICK)로 기록한다
  const viewed = page.waitForRequest(
    (request) =>
      request.url().endsWith('/recommendations/product-views') &&
      request.postDataJSON()?.viewType === 'QUICK',
  )
  await list.getByRole('button', { name: `${PRODUCT} 담기` }).click()
  await viewed
  const dialog = page.getByRole('dialog', { name: '옵션 고르고 담기' })
  const add = dialog.getByRole('button', { name: '장바구니 담기' })
  // 값이 하나뿐인 색상은 고르는 단계 없이 고정 줄로 보인다
  await expect(dialog.getByText('색상: 네이비', { exact: true })).toBeVisible()
  // 고르기 전에는 담을 수 없다
  await expect(add).toBeDisabled()

  const sizes = dialog.getByRole('group', { name: '사이즈', exact: true })
  await sizes.getByRole('button', { name: /^110/ }).click()
  await expect(sizes.getByRole('button', { name: /^110/ })).toHaveAttribute('aria-pressed', 'true')
  await add.click()
  await expect(dialog.getByText('담았어요.')).toBeVisible()
  await expect(dialog.getByRole('link', { name: '장바구니 보기' })).toHaveAttribute('href', '/cart')

  await dialog.getByRole('button', { name: '계속 쇼핑' }).click()
  await expect(dialog).toHaveCount(0)

  // 뒤 테스트의 주문에 섞이지 않게 담은 줄을 장바구니에서 뺀다
  await page.goto('/cart')
  const line = page.getByRole('listitem').filter({ hasText: PRODUCT }).filter({ hasText: '110' })
  await line.getByRole('button', { name: '빼기' }).click()
  await expect(line).toHaveCount(0)
})

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
  growthSpeed: null,
  wearablePeriods: [],
  ...overrides,
})

/** 보호자로 들어와 상품 A의 담기 팝업을 열고 자녀 501을 고른다 (사이즈 추천 스트림은 테스트가 흘려보낸다) */
async function openQuickAddWithChild(page: Page) {
  await page.route('**/api/v1/children', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: [CHILD] }) : route.fallback(),
  )
  await page.goto('/')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
  const list = page.getByRole('region', { name: '전체 상품' })
  await list.getByRole('button', { name: `${PRODUCT} 담기` }).click()
  const dialog = page.getByRole('dialog', { name: '옵션 고르고 담기' })
  await dialog.getByRole('button', { name: '하윤 (118cm)' }).click()
  return dialog
}

// 팝업은 규칙 결과를 먼저 그리지 않는다. 기다리는 칸과 추천 한 줄의 높이가 같아 팝업과 사이즈 버튼이 움직이지 않는다
test('상품 칸 담기: AI 답이 올 때까지 「추천 계산 중」만 보이고, 답이 오면 추천 한 줄과 「추천」 표시가 함께 나타난다', async ({
  page,
}) => {
  const stream = await holdEventStream(page, '/api/v1/recommendations/size')
  const dialog = await openQuickAddWithChild(page)
  const waiting = dialog.getByRole('status', { name: '추천 계산 중' })
  const sizes = dialog.getByRole('group', { name: '사이즈', exact: true })

  await expect(waiting).toBeVisible()
  const before = { dialog: await dialog.boundingBox(), sizes: await sizes.boundingBox() }

  await stream.send('rule', size({ recommendedSize: '110' }))
  // 규칙 결과를 받아도 기다림은 그대로다 (추천 한 줄 · 「추천」 표시 없음)
  await expect(dialog.getByText('AI가 사이즈를 더 살펴보고 있어요')).toHaveCount(0)
  await expect(waiting).toBeVisible()
  await expect(dialog.getByText('추천 사이즈')).toHaveCount(0)
  await expect(sizes.getByText('추천', { exact: true })).toHaveCount(0)

  await stream.send('ai', size({ recommendedSize: '120', source: 'AI' }))
  await expect(dialog.getByText('추천 사이즈')).toBeVisible()
  await expect(sizes.getByRole('button', { name: /^120/ })).toContainText('추천')
  await expect(waiting).toHaveCount(0)
  const after = { dialog: await dialog.boundingBox(), sizes: await sizes.boundingBox() }
  expect(Math.abs(after.dialog!.height - before.dialog!.height)).toBeLessThanOrEqual(2)
  expect(Math.abs(after.sizes!.y - before.sizes!.y)).toBeLessThanOrEqual(2)
  await stream.close()
})

test('상품 칸 담기: AI 답 없이 스트림이 닫히면 같은 자리에 규칙 추천 한 줄을 보인다', async ({
  page,
}) => {
  const stream = await holdEventStream(page, '/api/v1/recommendations/size')
  const dialog = await openQuickAddWithChild(page)
  const waiting = dialog.getByRole('status', { name: '추천 계산 중' })
  const sizes = dialog.getByRole('group', { name: '사이즈', exact: true })

  await stream.send('rule', size({ recommendedSize: '110' }))
  await expect(waiting).toBeVisible()
  await stream.close()

  await expect(waiting).toHaveCount(0)
  await expect(dialog.getByText('추천 사이즈')).toBeVisible()
  await expect(sizes.getByRole('button', { name: /^110/ })).toContainText('추천')
})

// AI 답이 늦으면 5초 뒤에 받아 둔 규칙 결과를 먼저 그린다. 뒤늦게 온 AI 답은 그 자리에서 바꾼다
test('상품 칸 담기: AI 답이 5초 넘게 늦으면 규칙 추천을 먼저 보이고, AI 답이 오면 그 답으로 바꾼다', async ({
  page,
}) => {
  await page.clock.install()
  const stream = await holdEventStream(page, '/api/v1/recommendations/size')
  const dialog = await openQuickAddWithChild(page)
  const waiting = dialog.getByRole('status', { name: '추천 계산 중' })
  const sizes = dialog.getByRole('group', { name: '사이즈', exact: true })

  await stream.send('rule', size({ recommendedSize: '110' }))
  await page.clock.fastForward(4000)
  await expect(waiting).toBeVisible()
  await expect(dialog.getByText('추천 사이즈')).toHaveCount(0)

  await page.clock.fastForward(1500)
  await expect(waiting).toHaveCount(0)
  await expect(dialog.getByText('추천 사이즈')).toBeVisible()
  await expect(sizes.getByRole('button', { name: /^110/ })).toContainText('추천')

  await stream.send('ai', size({ recommendedSize: '120', source: 'AI' }))
  await expect(sizes.getByRole('button', { name: /^120/ })).toContainText('추천')
  await expect(sizes.getByRole('button', { name: /^110/ })).not.toContainText('추천')
  await expect(waiting).toHaveCount(0)
  await stream.close()
})
