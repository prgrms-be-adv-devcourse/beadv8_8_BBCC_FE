import { expect, test } from '@playwright/test'

// 관리자 상품 기준 데이터: 항목(팔레트) 만들기 → 목록 값 더하기, 실측 항목 만들기 (BE #405).
// 가짜 백엔드를 다른 테스트와 같이 쓰므로 코드는 실행마다 다르게 만든다 (대문자와 _만)
const RUN = String(Date.now())
  .split('')
  .map((digit) => String.fromCharCode(65 + Number(digit)))
  .join('')

test('관리자 상품 기준 데이터: 항목 · 목록 값 · 실측 항목 만들기', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '관리자', exact: true }).first().click()
  await expect(page.getByText('관리자 · 회원 3')).toBeVisible()
  await page.goto('/admin')
  await page.getByRole('link', { name: '상품 기준 데이터' }).click()
  await expect(page.getByRole('heading', { name: '상품 기준 데이터' })).toBeVisible()

  await test.step('항목 만들기: 코드 형식이 틀리면 막고, 맞으면 목록에 보인다', async () => {
    const form = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: '항목 만들기' }) })
    await form.getByLabel('항목 이름').fill('시연 색')
    await form.getByLabel('코드 (대문자 · _)').fill('demo-color')
    await form.getByLabel('입력 방식').selectOption('PALETTE')
    await form.getByRole('textbox', { name: '목록 값 이름' }).fill('라벤더')
    await form.getByRole('textbox', { name: '색 코드' }).fill('#b9a3e3')
    await form.getByRole('button', { name: '항목 만들기' }).click()
    await expect(form.getByText('코드는 대문자와 _만 쓸 수 있어요.')).toBeVisible()

    await form.getByLabel('코드 (대문자 · _)').fill(`DEMO_COLOR_${RUN}`)
    await form.getByRole('button', { name: '항목 만들기' }).click()
    await expect(page.getByText(`DEMO_COLOR_${RUN}`)).toBeVisible()
  })

  await test.step('기존 항목에 목록 값 더하기', async () => {
    const card = page
      .locator('div')
      .filter({ hasText: `DEMO_COLOR_${RUN}` })
      .filter({
        has: page.getByRole('button', { name: '값 더하기' }),
      })
    await card.last().getByRole('textbox', { name: '목록 값 이름' }).fill('민트')
    await card.last().getByRole('textbox', { name: '색 코드' }).fill('#a8e6cf')
    await card.last().getByRole('button', { name: '값 더하기' }).click()
    await expect(card.last().getByText('민트')).toBeVisible()
  })

  await test.step('실측 항목 만들기: 코드 형식이 틀리면 막고, 맞으면 목록에 보인다', async () => {
    await page.getByRole('button', { name: '실측 항목', exact: true }).click()
    await page.getByLabel('실측 항목 이름').fill('시연 길이')
    await page.getByLabel('코드 (대문자 · _)').fill('demo-length')
    await page.getByRole('button', { name: '실측 항목 만들기' }).click()
    await expect(page.getByText('코드는 대문자와 _만 쓸 수 있어요.')).toBeVisible()

    await page.getByLabel('코드 (대문자 · _)').fill(`DEMO_LENGTH_${RUN}`)
    await page.getByRole('button', { name: '실측 항목 만들기' }).click()
    await expect(page.getByText(`DEMO_LENGTH_${RUN}`)).toBeVisible()
  })
})
