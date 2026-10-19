import { expect, test } from '@playwright/test'

// 구매자 상품 상세: 색상 칩 · 사이즈 칩을 따로 고른다. 색상을 고르면 사이즈 칩이 그 색상 기준으로 바뀐다.
// 가짜 백엔드 상품 1의 상세 응답을 로컬 상품 #4 모양(코랄 핑크/130 없음, 오트밀/130 품절, 코랄 핑크/120 3개)으로 바꿔 본다
const COLORS = [
  ['1', '네이비', '#1F2A44'],
  ['2', '오트밀', '#E8DCC8'],
  ['3', '코랄 핑크', '#E9A296'],
] as const
const SIZES = [
  ['11', '110'],
  ['12', '120'],
  ['13', '130'],
] as const
const STOCK: Record<string, [boolean, string, number | null]> = {
  '2-13': [false, 'SOLD_OUT', null],
  '3-12': [true, 'LOW', 3],
}

test('상품 상세: 색상 · 사이즈 칩 고르기 (없음 · 품절 · 적게 남음)', async ({ page }) => {
  await page.route('**/api/v1/products/1', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    const options = COLORS.flatMap(([color, colorName]) =>
      SIZES.filter(([size]) => !(color === '3' && size === '13')).map(([size, sizeName]) => {
        const [purchasable, stockStatus, stockQuantity] = STOCK[`${color}-${size}`] ?? [
          true,
          'AVAILABLE',
          null,
        ]
        return {
          optionId: `${color}${size}`,
          optionName: `색상: ${colorName} / 사이즈: ${sizeName}`,
          valueIds: [color, size],
          price: 25000,
          purchasable,
          stockStatus,
          stockQuantity,
        }
      }),
    )
    await route.fulfill({
      response,
      json: {
        ...body,
        optionAttributes: [
          {
            attributeId: '1',
            code: 'COLOR',
            name: '색상',
            values: COLORS.map(([valueId, value, colorCode]) => ({ valueId, value, colorCode })),
          },
          {
            attributeId: '2',
            code: 'SIZE',
            name: '사이즈',
            values: SIZES.map(([valueId, value]) => ({ valueId, value, colorCode: null })),
          },
        ],
        options,
        sizeSpecs: [],
      },
    })
  })
  await page.goto('/products/1')

  const colors = page.getByRole('group', { name: '색상', exact: true })
  const sizes = page.getByRole('group', { name: '사이즈', exact: true })
  await expect(page.getByText('색상을(를) 골라 주세요.')).toBeVisible()
  // 색상 칩은 색 점과 이름을 함께 보인다
  await expect(colors.getByRole('button', { name: /^오트밀/ }).locator('[data-swatch]')).toHaveCSS(
    'background-color',
    'rgb(232, 220, 200)',
  )

  // 오트밀: 130은 품절
  await colors.getByRole('button', { name: /^오트밀/ }).click()
  await expect(page.getByText('색상 · 오트밀')).toBeVisible()
  await expect(sizes.getByRole('button', { name: /^130/ })).toContainText('품절')
  await expect(sizes.getByRole('button', { name: /^130/ })).toBeDisabled()

  // 오트밀 110을 고른 뒤 코랄 핑크로 바꾸면 110은 그대로, 120은 3개 남음, 130은 없음
  await sizes.getByRole('button', { name: /^110/ }).click()
  await colors.getByRole('button', { name: /^코랄 핑크/ }).click()
  await expect(sizes.getByRole('button', { name: /^110/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(sizes.getByRole('button', { name: /^120/ })).toContainText('3개 남았어요')
  await expect(sizes.getByRole('button', { name: /^130/ })).toContainText('없음')
  await expect(sizes.getByRole('button', { name: /^130/ })).toBeDisabled()
  await expect(page.getByText('색상: 코랄 핑크 / 사이즈: 110 · 1개')).toBeVisible()
})
