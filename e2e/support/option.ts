import { expect, type Page } from '@playwright/test'

/** 상품 상세에서 색상 · 사이즈 칩을 차례로 고른다. 값이 하나뿐인 항목은 줄이 없어 건너뛴다 */
export async function pickOption(page: Page, color: string, size: string) {
  await expect(page.getByRole('spinbutton')).toBeVisible()
  for (const [name, value] of [
    ['색상', color],
    ['사이즈', size],
  ]) {
    const row = page.getByRole('group', { name, exact: true })
    if ((await row.count()) > 0)
      await row.getByRole('button', { name: new RegExp(`^${value}`) }).click()
  }
}
