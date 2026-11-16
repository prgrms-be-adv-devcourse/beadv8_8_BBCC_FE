import { expect, test } from '@playwright/test'

// 쇼핑 홈 첫 칸의 배너: 첫 장은 맞춤 안내, 나머지는 실제 상품 사진 배너 (누르면 그 상품으로)
test('홈 배너: 첫 장은 로그인 · 자녀 등록으로, 상품 배너는 그 상품 상세로 간다', async ({
  page,
}) => {
  await page.goto('/')
  const banners = page.getByRole('region', { name: '바로가기 배너' })
  await expect(banners.getByRole('link', { name: /로그인하고 시작하기/ })).toHaveAttribute(
    'href',
    /\/login/,
  )
  // 상품 배너: 계절 문구와 상점 이름이 얹히고 상품 상세로 간다
  const product = banners.getByRole('link', { name: /테스트상점/ }).first()
  await expect(product).toHaveAttribute('href', /^\/products\/\d+/)

  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
  // 로그인하면 첫 장이 자녀 등록 또는 고른 자녀의 맞춤 목록으로 바뀐다
  await expect(banners.getByRole('link', { name: /로그인하고 시작하기/ })).toHaveCount(0)
  await expect(banners.getByRole('link', { name: /자녀 등록하기|맞춤 상품 보기/ })).toHaveAttribute(
    'href',
    /\/my\/children\/new|\/recommended\//,
  )

  await product.click()
  await expect(page).toHaveURL(/\/products\/\d+/)
})
