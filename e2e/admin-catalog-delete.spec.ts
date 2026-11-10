import { expect, test } from '@playwright/test'
import { signInAdmin } from './support/admin'
import { acceptConfirms } from './support/confirm'

// 관리자 상품 기준 데이터 지우기: 확인 창을 거쳐 지우면 목록에서 빠지고, 쓰이는 중이면 거절 설명을 그대로 보여 준다.
// 가짜 백엔드를 다른 테스트와 같이 쓰므로 지울 데이터는 실행마다 다른 이름 · 코드로 만든다 (코드는 대문자와 _만)
const RUN = String(Date.now())
  .split('')
  .map((digit) => String.fromCharCode(65 + Number(digit)))
  .join('')

test('관리자 상품 기준 데이터: 항목 · 목록 값 · 실측 항목 · 상품 유형 · 카테고리 지우기', async ({
  page,
}) => {
  await acceptConfirms(page)
  await signInAdmin(page)
  const menu = page.getByRole('navigation', { name: '관리자 메뉴' })

  await test.step('항목 화면에서 목록 값과 항목을 지운다', async () => {
    await menu.getByRole('link', { name: '항목 · 목록 값' }).click()
    await page.getByRole('link', { name: '항목 만들기' }).click()
    await page.getByLabel('항목 이름').fill(`지울 항목 ${RUN}`)
    await page.getByLabel('코드 (대문자 · _)').fill(`TO_DELETE_${RUN}`)
    await page.getByLabel('입력 방식').selectOption('LIST')
    await page.getByRole('textbox', { name: '목록 값 이름' }).fill('지울 값')
    await page.getByRole('button', { name: '항목 만들기' }).click()
    await expect(page.getByRole('heading', { name: `지울 항목 ${RUN}`, level: 1 })).toBeVisible()

    const values = page.getByRole('list', { name: '목록 값' })
    await values.getByRole('button', { name: '지울 값 삭제' }).click()
    await expect(page.getByText('목록 값이 없어요.')).toBeVisible()

    await page.getByRole('button', { name: `지울 항목 ${RUN} 삭제` }).click()
    await expect(page).toHaveURL(/\/admin\/catalog\/attributes$/)
    await expect(page.getByText(`TO_DELETE_${RUN}`)).toHaveCount(0)
  })

  await test.step('실측 항목을 지우면 목록에서 빠진다', async () => {
    await menu.getByRole('link', { name: '실측 항목', exact: true }).click()
    await page.getByRole('link', { name: '실측 항목 만들기' }).click()
    await page.getByLabel('실측 항목 이름').fill(`지울 길이 ${RUN}`)
    await page.getByLabel('코드 (대문자 · _)').fill(`TO_DELETE_LENGTH_${RUN}`)
    await page.getByRole('button', { name: '실측 항목 만들기' }).click()
    const table = page.getByRole('table', { name: '실측 항목' })
    await table.getByRole('button', { name: `지울 길이 ${RUN} 삭제` }).click()
    await expect(table.getByText(`TO_DELETE_LENGTH_${RUN}`)).toHaveCount(0)
  })

  await test.step('카테고리가 가리키는 상품 유형은 거절 설명을 보여 준다', async () => {
    await menu.getByRole('link', { name: '상품 유형', exact: true }).click()
    await page.getByRole('button', { name: '의류 삭제' }).click()
    await expect(
      page.getByText('카테고리가 가리키는 상품 유형은 지울 수 없습니다.', { exact: false }),
    ).toBeVisible()
  })

  await test.step('카테고리: 하위가 있으면 거절하고, 없으면 지운다', async () => {
    await menu.getByRole('link', { name: '카테고리', exact: true }).click()
    await page.getByRole('link', { name: '카테고리 만들기' }).click()
    await page.getByLabel('카테고리 이름').fill(`지울 카테고리 ${RUN}`)
    await page.getByLabel('종류').selectOption('MIDDLE')
    await page.getByRole('button', { name: '카테고리 만들기' }).click()
    await expect(page).toHaveURL(/\/admin\/catalog\/categories$/)

    await page.getByRole('button', { name: '의류 삭제' }).click()
    await expect(
      page.getByText('하위 카테고리가 있는 카테고리는 지울 수 없습니다.', { exact: false }),
    ).toBeVisible()

    await page.getByRole('button', { name: `지울 카테고리 ${RUN} 삭제` }).click()
    await expect(page.getByText(`지울 카테고리 ${RUN}`)).toHaveCount(0)
  })
})
