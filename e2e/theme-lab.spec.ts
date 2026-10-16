import { expect, test } from '@playwright/test'

// 테마 바꿔 보기: 메인 색을 바꾸면 문서 CSS 변수가 바뀌고, 링크(?theme=)로 받은 색으로 열리고, off면 버튼이 숨는다
test('테마 바꿔 보기: 미리 정한 색 · 기본값 · 링크 · 숨기기', async ({ page }) => {
  const primary = () =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
    )

  await page.goto('/')
  await page.getByRole('button', { name: '테마' }).click()
  const panel = page.getByRole('region', { name: '테마 바꿔 보기' })
  await panel.getByRole('button', { name: '블루' }).click()
  await expect.poll(primary).toBe('#2343d1')
  // 새로고침해도 유지 (내 브라우저에 저장)
  await page.reload()
  await expect.poll(primary).toBe('#2343d1')
  await page.getByRole('button', { name: '테마' }).click()
  await panel.getByRole('button', { name: '기본값' }).click()
  await expect.poll(primary).toBe('#681078')

  await page.goto('/?theme=1f6f4a.f4d35e.a9b77d')
  await expect.poll(primary).toBe('#1f6f4a')
  await page.goto('/?theme=off')
  await expect(page.getByRole('button', { name: '테마' })).toHaveCount(0)
  await page.goto('/?theme=on')
  await expect(page.getByRole('button', { name: '테마' })).toBeVisible()
  await page.evaluate(() => localStorage.removeItem('kidly.theme'))
})
