import { expect, type Page } from '@playwright/test'

/** 가짜 백엔드의 관리자 계정 (BE local 기본 부트스트랩 값과 같다) */
export const ADMIN_LOGIN = { email: 'admin@kidly.local', password: 'local-admin-password' }

/**
 * 관리자 화면에서 관리자 계정으로 로그인한다 (회원 시연 역할과 따로, BE #736).
 * 이미 로그인했으면(재발급 쿠키) 그대로 둔다. 끝나면 관리자 홈에 있다
 */
export async function signInAdmin(page: Page) {
  await page.goto('/admin')
  const logout = page.getByRole('button', { name: '관리자 로그아웃' })
  const submit = page.getByRole('button', { name: '관리자 로그인' })
  await expect(logout.or(submit)).toBeVisible()
  if (await submit.isVisible()) {
    await page.getByLabel('이메일').fill(ADMIN_LOGIN.email)
    await page.getByLabel('비밀번호').fill(ADMIN_LOGIN.password)
    await submit.click()
  }
  await expect(logout).toBeVisible()
}
