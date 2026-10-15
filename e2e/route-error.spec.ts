import { expect, test } from '@playwright/test'

// 오류 화면: 화면 하나가 깨져도 레이아웃(시연 막대 · 머리말)은 남고, 다시 시도 · 처음 화면으로 갈 수 있다

test('화면 파일을 못 불러오면 레이아웃은 그대로, 다시 시도하면 화면이 열린다', async ({ page }) => {
  // 배포 직후처럼 상품 상세 화면 파일만 못 받는 상황
  const pageFile = '**/src/pages/shop/product-detail/index.ts*'
  await page.route(pageFile, (route) => route.abort())
  await page.goto('/products/1')

  const alert = page.getByRole('alert')
  await expect(alert.getByText('화면을 불러오지 못했어요')).toBeVisible()
  await expect(alert.getByRole('link', { name: '처음 화면으로' })).toHaveAttribute('href', '/')
  // 레이아웃은 남는다: 시연 막대 역할 버튼 · 쇼핑 머리말
  await expect(page.getByRole('button', { name: '보호자', exact: true }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: '장바구니' })).toBeVisible()

  await page.unroute(pageFile)
  await alert.getByRole('button', { name: '다시 시도' }).click()
  await expect(page.getByText('데일리 맨투맨 (상품 A)').first()).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('없는 주소는 레이아웃 안에서 안내한다', async ({ page }) => {
  await page.goto('/no-such-page')
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeVisible()
  await expect(page.getByRole('link', { name: '장바구니' }).first()).toBeVisible()
})
