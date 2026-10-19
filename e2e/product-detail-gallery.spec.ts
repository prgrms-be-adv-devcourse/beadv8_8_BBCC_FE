import { expect, test } from '@playwright/test'

// 구매자 상품 상세: 대표 → 상세 사진을 밀어 넘기고, 아래 상품 설명에 설명 글과 상세 사진을 모두 쌓는다.
// 가짜 백엔드 상품에는 사진이 없어 상세 응답에 사진 세 장 · 설명을 넣어 본다
const IMAGE = 'https://images.example.test/products/'
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test('상품 상세: 사진 밀어 넘기기 · 작은 사진 줄 · 상품 설명과 상세 사진', async ({ page }) => {
  await page.route(`${IMAGE}**`, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }),
  )
  await page.route('**/api/v1/products/1', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    await route.fulfill({
      response,
      json: {
        ...body,
        description: '부드러운 면 맨투맨이에요.\n세탁기 사용 가능',
        imageUrls: ['t', 'a', 'b'].map((name) => `${IMAGE}${name}.png`),
      },
    })
  })
  await page.goto('/products/1')

  // 큰 사진은 대표부터, 작은 사진 줄에 세 장
  const thumbs = page.getByRole('button', { name: /^사진 \d 보기$/ })
  await expect(thumbs).toHaveCount(3)
  await expect(page.getByRole('button', { name: '사진 1 보기' })).toHaveAttribute(
    'aria-current',
    'true',
  )

  // 작은 사진을 누르면 그 사진으로 넘어간다
  await page.getByRole('button', { name: '사진 3 보기' }).click()
  await expect(page.getByRole('button', { name: '사진 3 보기' })).toHaveAttribute(
    'aria-current',
    'true',
  )

  // 큰 사진을 밀어 넘기면(scroll) 작은 사진 줄 표시도 따라간다
  const track = page.getByRole('group', { name: /사진 3장/ })
  await track.evaluate((el) => el.scrollTo({ left: el.clientWidth, behavior: 'instant' }))
  await expect(page.getByRole('button', { name: '사진 2 보기' })).toHaveAttribute(
    'aria-current',
    'true',
  )

  // PC는 이전 · 다음 버튼으로도 넘긴다
  await page.getByRole('button', { name: '다음 사진' }).click()
  await expect(page.getByRole('button', { name: '사진 3 보기' })).toHaveAttribute(
    'aria-current',
    'true',
  )

  // 상품 설명: 줄바꿈을 지킨 설명 글 아래에 대표를 뺀 상세 사진 두 장
  const description = page.getByRole('region', { name: '상품 설명' })
  await expect(description).toContainText('부드러운 면 맨투맨이에요.')
  await expect(description.getByRole('img')).toHaveCount(2)
})

test('휴대폰 너비: 큰 사진이 화면 너비에 맞고 이전 · 다음 버튼은 숨긴다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.route(`${IMAGE}**`, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }),
  )
  await page.route('**/api/v1/products/1', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    await route.fulfill({
      response,
      json: { ...body, imageUrls: ['t', 'a'].map((name) => `${IMAGE}${name}.png`) },
    })
  })
  await page.goto('/products/1')
  await expect(page.getByRole('button', { name: '사진 2 보기' })).toBeVisible()
  // 이전 · 다음 버튼은 PC에서만
  await expect(page.getByRole('button', { name: '다음 사진' })).toBeHidden()
  // 큰 사진은 화면 너비 안에 들어온다 (머리말 넘침은 이 화면과 별개)
  const box = await page.getByRole('group', { name: /사진 2장/ }).boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(375)
})
