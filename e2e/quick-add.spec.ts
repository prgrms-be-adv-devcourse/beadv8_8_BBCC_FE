import { expect, test } from '@playwright/test'

// 상품 칸의 「담기」: 팝업에서 옵션을 고르고 담는다. 추천 사이즈가 있어도 대신 고르지 않는다
const PRODUCT = '데일리 맨투맨 (상품 A)'

test('상품 칸 담기: 로그인 전에는 고른 옵션을 실어 로그인으로 보낸다', async ({ page }) => {
  await page.goto('/')
  const list = page.getByRole('region', { name: '전체 상품' })
  await list.getByRole('button', { name: `${PRODUCT} 담기` }).click()
  const dialog = page.getByRole('dialog', { name: '옵션 고르고 담기' })
  await expect(dialog.getByText(PRODUCT)).toBeVisible()
  // 옵션 가격이 모두 같으면 물결표를 붙이지 않는다
  await expect(dialog.getByText('25,000원', { exact: true })).toBeVisible()

  // 사이즈를 고르기 전에 누르면 안내만 한다
  await dialog.getByRole('button', { name: '로그인하고 담기' }).click()
  await expect(dialog.getByRole('alert')).toHaveText('사이즈를 골라 주세요.')

  const sizes = dialog.getByRole('group', { name: '사이즈', exact: true })
  await sizes.getByRole('button', { name: /^110/ }).click()
  await expect(dialog.getByRole('link', { name: '로그인하고 담기' })).toHaveAttribute(
    'href',
    /\/login.*option/,
  )

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('상품 칸 담기: 보호자는 팝업에서 사이즈를 골라 장바구니에 담는다', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '보호자', exact: true }).first().click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()

  const list = page.getByRole('region', { name: '전체 상품' })
  // 팝업을 열면 상세 진입과 구분되는 조회(QUICK)로 기록한다
  const viewed = page.waitForRequest(
    (request) =>
      request.url().endsWith('/recommendations/product-views') &&
      request.postDataJSON()?.viewType === 'QUICK',
  )
  await list.getByRole('button', { name: `${PRODUCT} 담기` }).click()
  await viewed
  const dialog = page.getByRole('dialog', { name: '옵션 고르고 담기' })
  const add = dialog.getByRole('button', { name: '장바구니 담기' })
  // 값이 하나뿐인 색상은 고르는 단계 없이 고정 줄로 보인다
  await expect(dialog.getByText('색상: 네이비', { exact: true })).toBeVisible()
  // 고르기 전에는 담을 수 없다
  await expect(add).toBeDisabled()

  const sizes = dialog.getByRole('group', { name: '사이즈', exact: true })
  await sizes.getByRole('button', { name: /^110/ }).click()
  await expect(sizes.getByRole('button', { name: /^110/ })).toHaveAttribute('aria-pressed', 'true')
  await add.click()
  await expect(dialog.getByText('담았어요.')).toBeVisible()
  await expect(dialog.getByRole('link', { name: '장바구니 보기' })).toHaveAttribute('href', '/cart')

  await dialog.getByRole('button', { name: '계속 쇼핑' }).click()
  await expect(dialog).toHaveCount(0)

  // 뒤 테스트의 주문에 섞이지 않게 담은 줄을 장바구니에서 뺀다
  await page.goto('/cart')
  const line = page.getByRole('listitem').filter({ hasText: PRODUCT }).filter({ hasText: '110' })
  await line.getByRole('button', { name: '빼기' }).click()
  await expect(line).toHaveCount(0)
})
