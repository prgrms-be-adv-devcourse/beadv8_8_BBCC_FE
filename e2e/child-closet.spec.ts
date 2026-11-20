import { expect, test } from '@playwright/test'
import { base, loginChild, registerChildWithAccount } from './support/child-wish'

// 자녀 추천 (BE #1639): 자녀 토큰으로 맛보기 · 사이즈 추천을 읽는다. 실패하면 안내 없이 새로 들어온 옷으로 바꾼다
test('내 옷장은 내 키에 맞는 옷을, 상품 상세는 내 사이즈 추천을 보여 준다', async ({ page }) => {
  const { loginId } = await registerChildWithAccount(page)
  await loginChild(page, loginId)

  const picks = page.getByRole('region', { name: '내 키에 딱 맞는 옷' })
  await expect(picks).toBeVisible()
  await expect(picks.getByText(/잘 맞아요$/).first()).toBeVisible()

  await page.goto('/child/products/1')
  await expect(page.getByText('추천 사이즈').first()).toBeVisible()
})

test('추천을 받지 못하면 오류 없이 새로 들어온 옷을 보여 준다', async ({ page, request }) => {
  const { loginId } = await registerChildWithAccount(page)
  await request.post(`${base}/__fake/child-recommendations-forbidden`, { data: { loginId } })
  await loginChild(page, loginId)

  const arrivals = page.getByRole('region', { name: '새로 들어온 옷' })
  await expect(arrivals).toBeVisible()
  await expect(arrivals.getByRole('link').first()).toBeVisible()
  await expect(page.getByRole('region', { name: '내 키에 딱 맞는 옷' })).toHaveCount(0)
  await expect(arrivals.getByText(/잘 맞아요$/)).toHaveCount(0)

  await page.goto('/child/products/1')
  await expect(page.getByRole('heading', { name: '데일리 맨투맨 (상품 A)' })).toBeVisible()
  await expect(page.getByText('추천 사이즈')).toHaveCount(0)
  await expect(page.getByText('추천 계산 중…')).toHaveCount(0)
})
