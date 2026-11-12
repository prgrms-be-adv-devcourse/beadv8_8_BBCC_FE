import { expect, test } from '@playwright/test'
import { signInAdmin } from './support/admin'
import { acceptConfirms } from './support/confirm'

// 관리자 리뷰 검사: 숨김(판단 대기) 탭 → 리뷰 확인 → 다시 공개 → 목록을 다시 부른다.
// 리뷰를 숨기려면 구매확정까지 가야 해서 목록 · 조치 응답은 BE 계약 모양으로 가로챈다 (가짜 백엔드 규칙은 계약 테스트가 본다)
const HIDDEN_REVIEW = {
  reviewId: '7',
  productId: '1',
  status: 'HIDDEN',
  reason: 'PROFANITY',
  moderatedAt: '2026-11-12T10:01:00',
  attempts: 0,
  attemptsExhausted: false,
  content: '바보 같은 옷',
  imageUrls: [],
  createdAt: '2026-11-12T10:00:00',
}

test('리뷰 검사: 숨김 리뷰를 보고 다시 공개하면 PATCH visibility VISIBLE을 보내고 목록에서 빠진다', async ({
  page,
}) => {
  let isRestored = false
  const sent: unknown[] = []
  await page.route('**/api/v1/admin/community/reviews?*', (route) => {
    const status = new URL(route.request().url()).searchParams.get('status')
    const items =
      status === 'HIDDEN' && !isRestored
        ? [HIDDEN_REVIEW]
        : status === 'RESTORED' && isRestored
          ? [{ ...HIDDEN_REVIEW, status: 'RESTORED' }]
          : []
    return route.fulfill({ json: { items, nextCursor: null } })
  })
  await page.route('**/api/v1/admin/community/reviews/7/visibility', (route) => {
    sent.push(route.request().postDataJSON())
    isRestored = true
    return route.fulfill({ json: { reviewId: '7', status: 'RESTORED' } })
  })

  await acceptConfirms(page)
  await signInAdmin(page)
  await page
    .getByRole('navigation', { name: '관리자 메뉴' })
    .getByRole('link', { name: '리뷰 검사' })
    .click()
  await expect(page.getByRole('heading', { name: '리뷰 검사' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '숨김 (판단 대기)' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  const review = page.getByRole('article', { name: '리뷰 #7' })
  await expect(review.getByText('바보 같은 옷')).toBeVisible()
  await expect(review.getByText('욕설 · 비속어')).toBeVisible()
  await expect(review.getByRole('button', { name: '숨김 확정' })).toBeVisible()

  await review.getByRole('button', { name: '다시 공개' }).click()
  await expect(page.getByText('숨김 (판단 대기) 리뷰가 없어요.')).toBeVisible()
  expect(sent).toEqual([{ visibility: 'VISIBLE' }])

  await page.getByRole('tab', { name: '다시 공개' }).click()
  await expect(page).toHaveURL(/status=RESTORED/)
  const restored = page.getByRole('article', { name: '리뷰 #7' })
  await expect(restored.getByRole('button', { name: '숨김 확정' })).toBeVisible()
  await expect(restored.getByRole('button', { name: '다시 공개' })).toHaveCount(0)
})
