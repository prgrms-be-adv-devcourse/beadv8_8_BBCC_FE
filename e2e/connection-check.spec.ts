import { expect, test } from '@playwright/test'
import { signInAdmin } from './support/admin'

// 시연 콘솔 "백엔드 연결 점검": 실제 API 조회를 차례로 불러 결과 표를 채운다 (가짜 백엔드).
// 역할이 없는 API는 건너뛴다

test('연결 점검: 조회 API 결과 표 · 역할 건너뜀', async ({ page }) => {
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

  // 관리자 계정으로 로그인하면(회원 역할과 따로) 관리자 API도 부른다
  await signInAdmin(page)
  await page.goto('/console')
  await page.getByRole('link', { name: '백엔드 연결 점검' }).click()
  await page.getByRole('button', { name: '전체 점검 실행' }).click()
  await expect(page.getByRole('row', { name: '점검 회원 관리' })).toContainText('통과')
  await expect(summary).toContainText('실패 0')

  expect(errors).toEqual([])
})
