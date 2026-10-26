import { expect, test } from '@playwright/test'

// 관리자 상품 기준 데이터: 항목(팔레트) 만들기 → 목록 값 더하기, 실측 항목 만들기 (BE #405),
// 상품 유형 만들기 (BE #424), 카테고리 만들기 (BE #425).
// 가짜 백엔드를 다른 테스트와 같이 쓰므로 코드는 실행마다 다르게 만든다 (대문자와 _만)
const RUN = String(Date.now())
  .split('')
  .map((digit) => String.fromCharCode(65 + Number(digit)))
  .join('')

test('관리자 상품 기준 데이터: 항목 · 목록 값 · 실측 항목 · 상품 유형 · 카테고리 만들기', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: '관리자', exact: true }).first().click()
  await expect(page.getByText('관리자 · 회원 3')).toBeVisible()
  await page.goto('/admin')
  // 기준 데이터는 종류마다 메뉴 · 목록 · 만들기 화면이 따로 있다 (목록 · 뒤로 링크와 이름이 겹쳐 메뉴 안에서 찾는다)
  const menu = page.getByRole('navigation', { name: '관리자 메뉴' })
  await menu.getByRole('link', { name: '항목 · 목록 값' }).click()
  await expect(page.getByRole('heading', { name: '항목 · 목록 값', level: 1 })).toBeVisible()

  await test.step('항목 만들기: 코드 형식이 틀리면 막고, 맞으면 그 항목 화면으로 간다', async () => {
    await page.getByRole('link', { name: '항목 만들기' }).click()
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
    await expect(page).toHaveURL(/\/admin\/catalog\/attributes\/\d+$/)
    await expect(page.getByRole('heading', { name: '시연 색', level: 1 })).toBeVisible()
    await expect(page.getByText(`DEMO_COLOR_${RUN}`)).toBeVisible()
  })

  await test.step('기존 항목에 목록 값 더하기', async () => {
    const values = page.getByRole('list', { name: '목록 값' })
    await expect(values.getByText('라벤더')).toBeVisible()
    await page.getByRole('textbox', { name: '목록 값 이름' }).fill('민트')
    await page.getByRole('textbox', { name: '색 코드' }).fill('#a8e6cf')
    await page.getByRole('button', { name: '값 더하기' }).click()
    await expect(values.getByText('민트')).toBeVisible()
  })

  await test.step('실측 항목 만들기: 코드 형식이 틀리면 막고, 맞으면 목록에 보인다', async () => {
    await menu.getByRole('link', { name: '실측 항목', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: '실측 항목', level: 1, exact: true }),
    ).toBeVisible()
    await page.getByRole('link', { name: '실측 항목 만들기' }).click()
    await page.getByLabel('실측 항목 이름').fill('시연 길이')
    await page.getByLabel('코드 (대문자 · _)').fill('demo-length')
    await page.getByRole('button', { name: '실측 항목 만들기' }).click()
    await expect(page.getByText('코드는 대문자와 _만 쓸 수 있어요.')).toBeVisible()

    await page.getByLabel('코드 (대문자 · _)').fill(`DEMO_LENGTH_${RUN}`)
    await page.getByRole('button', { name: '실측 항목 만들기' }).click()
    await expect(page).toHaveURL(/\/admin\/catalog\/measurement-items$/)
    await expect(
      page.getByRole('table', { name: '실측 항목' }).getByText(`DEMO_LENGTH_${RUN}`),
    ).toBeVisible()
  })

  await test.step('상품 유형 만들기: 허용 값이 없으면 막고, 고르면 목록에 보인다', async () => {
    await menu.getByRole('link', { name: '상품 유형', exact: true }).click()
    await page.getByRole('link', { name: '상품 유형 만들기' }).click()
    await page.getByLabel('유형 이름').fill(`시연 유형 ${RUN}`)
    await page.getByLabel('연결할 항목').selectOption({ label: '색상 (COLOR)' })
    await page.getByLabel('모든 값 허용').uncheck()
    await page.getByRole('button', { name: '상품 유형 만들기' }).click()
    await expect(
      page.getByText('모든 값을 허용하지 않는 항목에는 허용 값을 하나 이상 골라 주세요.'),
    ).toBeVisible()

    await page.getByLabel('네이비').check()
    await page.getByRole('button', { name: '상품 유형 만들기' }).click()
    await expect(page).toHaveURL(/\/admin\/catalog\/product-types$/)
    const created = page.getByRole('row').filter({ hasText: `시연 유형 ${RUN}` })
    await expect(created.getByText('옵션 · 필수 · 허용 값 네이비')).toBeVisible()
  })

  await test.step('카테고리 만들기: 말단은 유형을 골라야 하고, 만들면 트리에 보인다', async () => {
    await menu.getByRole('link', { name: '카테고리', exact: true }).click()
    await page.getByRole('link', { name: '카테고리 만들기' }).click()
    await page.getByLabel('카테고리 이름').fill(`시연 바지 ${RUN}`)
    await page.getByLabel('부모 카테고리').selectOption({ label: '의류' })
    await page.getByRole('button', { name: '카테고리 만들기' }).click()
    await expect(page.getByText('말단 카테고리는 상품 유형을 골라 주세요.')).toBeVisible()

    await page.getByLabel('상품 유형').selectOption({ label: '의류' })
    await page.getByLabel('총장').check()
    await page.getByRole('button', { name: '카테고리 만들기' }).click()
    await expect(page).toHaveURL(/\/admin\/catalog\/categories$/)
    await expect(page.getByText(`└ 시연 바지 ${RUN}`)).toBeVisible()
  })
})
