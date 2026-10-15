import { expect, test } from '@playwright/test'

// 시연 콘솔 "백엔드 연결 점검": 실제 API 조회를 차례로 불러 결과 표를 채운다 (가짜 백엔드).
// 역할이 없는 API는 건너뛰고, 목 조회 API는 목을 거치지 않고 실제 서버에 물어본다

test('연결 점검: 조회 API 결과 표 · 역할 건너뜀 · 목 API 백엔드 확인', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/console')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()
  await page.getByRole('link', { name: '백엔드 연결 점검' }).click()
  await expect(page.getByRole('heading', { name: '백엔드 연결 점검' })).toBeVisible()

  await page.getByRole('button', { name: '전체 점검 실행' }).click()
  const summary = page.getByRole('status', { name: '점검 결과' })
  await expect(summary).toContainText('실패 0')
  await expect(summary).toContainText('계약 다름 0')
  await expect(page.getByRole('row', { name: '점검 상품 목록' })).toContainText('통과')
  await expect(page.getByRole('row', { name: '점검 상품 상세' })).toContainText('통과')
  await expect(page.getByRole('row', { name: '점검 회원 관리' })).toContainText('ADMIN 역할 필요')

  // 관리자로 바꾸면 관리자 API도 부른다
  await page.getByRole('button', { name: '관리자', exact: true }).first().click()
  await expect(page.getByText('관리자 · 회원 3')).toBeVisible()
  await page.getByRole('button', { name: '전체 점검 실행' }).click()
  await expect(page.getByRole('row', { name: '점검 회원 관리' })).toContainText('통과')
  await expect(summary).toContainText('실패 0')

  // 목 조회 API: 가짜 백엔드에 없는 것은 "BE 아직 없음"
  await page.getByRole('button', { name: '백엔드에 물어보기' }).click()
  await expect(page.getByRole('listitem', { name: '목 API GET /seller/products' })).toContainText(
    'BE 아직 없음',
  )
  await expect(page.getByRole('listitem', { name: '목 API PATCH /seller/me' })).toContainText(
    '부르지 않음',
  )

  expect(errors).toEqual([])
})
