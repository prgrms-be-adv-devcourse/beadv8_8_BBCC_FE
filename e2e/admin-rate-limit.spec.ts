import { expect, test } from '@playwright/test'
import { signInAdmin } from './support/admin'

// 요청 수 제한 (BE #1421): 전체 한도를 바꾸면 새로고침 뒤에도 그 값이다. 끄기는 확인 창을 거치고, 다시 켤 수 있다
test('요청 수 제한: 잘못된 건수 안내 → 전체 한도 변경 → 새로고침 뒤 유지 → 끄고 다시 켜기', async ({
  page,
}) => {
  await signInAdmin(page)
  await page
    .getByRole('navigation', { name: '관리자 메뉴' })
    .getByRole('link', { name: '요청 수 제한' })
    .click()
  await expect(page.getByRole('heading', { name: '요청 수 제한', level: 1 })).toBeVisible()

  const total = page.getByRole('region', { name: /^전체 한도/ })
  await total.getByLabel('전체 한도 건수').fill('0')
  await total.getByRole('button', { name: '저장' }).click()
  await expect(total.getByText('건수는 1 이상의 정수로 입력해 주세요.')).toBeVisible()

  await total.getByLabel('전체 한도 기간', { exact: true }).fill('1')
  await total.getByLabel('전체 한도 기간 단위').selectOption({ label: '분' })
  await total.getByLabel('전체 한도 건수').fill('800')
  await total.getByRole('button', { name: '저장' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: '바꾸기' }).click()
  await expect(total.getByRole('heading')).toContainText('1분에 800건')
  await expect(page.getByText('전체 한도를 1분에 800건으로 바꿨어요')).toBeVisible()

  await page.reload()
  await expect(total.getByRole('heading')).toContainText('1분에 800건')
  await expect(total.getByLabel('전체 한도 건수')).toHaveValue('800')

  const enabled = page.getByRole('switch', { name: '요청 수 제한' })
  await expect(enabled).toHaveAttribute('aria-checked', 'true')
  await enabled.click()
  await page.getByRole('alertdialog').getByRole('button', { name: '끄기' }).click()
  await expect(enabled).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByText('요청 수 제한을 껐어요')).toBeVisible()
  await page.reload()
  await expect(enabled).toHaveAttribute('aria-checked', 'false')
  await enabled.click()
  await expect(enabled).toHaveAttribute('aria-checked', 'true')

  // 다른 테스트가 같은 가짜 백엔드를 쓰므로 기본값(1초에 500건)으로 되돌린다
  await total.getByLabel('전체 한도 기간', { exact: true }).fill('1')
  await total.getByLabel('전체 한도 기간 단위').selectOption({ label: '초' })
  await total.getByLabel('전체 한도 건수').fill('500')
  await total.getByRole('button', { name: '저장' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: '바꾸기' }).click()
  await expect(total.getByRole('heading')).toContainText('1초에 500건')
})
