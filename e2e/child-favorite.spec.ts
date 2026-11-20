import { expect, test } from '@playwright/test'
import { loginChild, registerChildWithAccount } from './support/child-wish'

// 자녀 계정 찜 (BE #1377): 자녀 화면에도 하트 · 내 찜. 목록 · 하트는 자녀 본인 것만, 찜 수는 회원과 합친 값
test('자녀 화면: 상품 하트로 찜하면 찜 수가 오르고 「내 찜」에 모이며, 보호자 하트에는 보이지 않는다', async ({
  page,
}) => {
  const { loginId } = await registerChildWithAccount(page)
  await loginChild(page, loginId)

  await page.goto('/child/products/1')
  await expect(page.getByRole('heading', { name: '데일리 맨투맨 (상품 A)' })).toBeVisible()
  const unfavorited = page.getByRole('button', { name: '찜하기', exact: true })
  const favorited = page.getByRole('button', { name: '찜 취소', exact: true })
  await expect(unfavorited).toBeEnabled()
  const before = Number(await unfavorited.innerText())
  await unfavorited.click()
  await expect(favorited).toHaveAttribute('aria-pressed', 'true')
  await expect(favorited).toHaveText(String(before + 1))

  await page.getByRole('link', { name: '찜', exact: true }).click()
  await expect(page).toHaveURL('/child/favorites')
  const row = page
    .getByRole('list', { name: '찜한 상품' })
    .getByRole('listitem')
    .filter({ hasText: '데일리 맨투맨 (상품 A)' })
  await expect(row).toBeVisible()
  // 자녀 화면의 상품 링크는 자녀 상품 상세로
  await expect(row.getByRole('link').first()).toHaveAttribute('href', '/child/products/1')

  // 보호자 화면의 하트에는 자녀의 찜이 보이지 않는다 (찜 수는 합친 값)
  await page.goto('/products/1')
  const guardianHeart = page.getByRole('button', { name: /^찜(하기| 취소)$/ })
  await expect(guardianHeart).toBeEnabled()
  await expect(guardianHeart).toContainText(String(before + 1))

  await page.goto('/child/favorites')
  await row.getByRole('button', { name: '찜 취소' }).click()
  await expect(row).toHaveCount(0)
})

test('지운 자녀 계정(403)으로 찜하면 안내하고 자녀 로그아웃 → 자녀 로그인 화면', async ({
  page,
}) => {
  const { loginId } = await registerChildWithAccount(page)
  await loginChild(page, loginId)
  await page.route('**/api/v1/favorites/1', (route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({
          status: 403,
          contentType: 'application/problem+json',
          json: {
            type: 'about:blank',
            title: '삭제된 자녀 계정입니다',
            status: 403,
            detail: '삭제된 자녀 계정입니다.',
            instance: '/api/v1/favorites/1',
          },
        })
      : route.fallback(),
  )
  await page.goto('/child/products/1')
  await page.getByRole('button', { name: '찜하기', exact: true }).click()
  await expect(page.getByText('삭제된 자녀 계정입니다.')).toBeVisible()
  await expect(page.getByRole('heading', { name: '자녀 로그인' })).toBeVisible()
})
