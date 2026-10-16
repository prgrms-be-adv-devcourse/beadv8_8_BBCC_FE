import { expect, test } from '@playwright/test'

// 거르기는 주소에 남는다. 주소 변경이 화면에 반영되기 전에 다음 거르기를 바꿔도 앞 변경이 덮이지 않아야 한다

test('쇼핑 홈: 카테고리를 지운 바로 뒤 정렬을 바꿔도 카테고리가 되살아나지 않는다', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: '상의', exact: true }).click()
  await expect(page).toHaveURL(/cat=/)

  await page.getByRole('button', { name: '전체 카테고리' }).click()
  await page.getByRole('combobox', { name: '정렬' }).selectOption('PRICE_ASC')

  await expect(page).toHaveURL(/sort=PRICE_ASC/)
  expect(new URL(page.url()).searchParams.get('cat')).toBeNull()
  await expect(page.getByRole('button', { name: '전체 카테고리' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
