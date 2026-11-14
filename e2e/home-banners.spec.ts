import { expect, test } from '@playwright/test'

// 쇼핑 홈 첫 칸의 배너: 누르면 갈 곳이 있는 것만 두고, 보는 사람에 맞춰 고른다
test('홈 배너: 로그인 전에는 로그인 · 판매자 입점, 보호자는 받은 조르기 · 내 찜이 더해지고 넘길 수 있다', async ({
  page,
}) => {
  await page.goto('/')
  const banners = page.getByRole('region', { name: '바로가기 배너' })
  await expect(banners.getByRole('link', { name: /로그인하고 맞는 사이즈 보기/ })).toHaveAttribute(
    'href',
    /\/login/,
  )
  await expect(banners.getByRole('link', { name: /판매자 입점/ })).toHaveAttribute(
    'href',
    '/center/apply',
  )
  await expect(banners.getByRole('link', { name: /받은 조르기/ })).toHaveCount(0)
  // 두 장이 한 화면에 다 보이면 넘기는 버튼이 없다
  await expect(banners.getByRole('button', { name: '다음 배너' })).toHaveCount(0)

  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
  await expect(banners.getByRole('link', { name: /받은 조르기/ })).toHaveAttribute(
    'href',
    '/my/wishes',
  )
  await expect(banners.getByRole('link', { name: /내 찜/ })).toHaveAttribute(
    'href',
    '/my/favorites',
  )
  // 네 장을 두 장씩 보여 세 번 넘길 수 있다
  await expect(banners.getByText('1 / 3')).toBeVisible()
  await banners.getByRole('button', { name: '다음 배너' }).click()
  await expect(banners.getByText('2 / 3')).toBeVisible()
})
