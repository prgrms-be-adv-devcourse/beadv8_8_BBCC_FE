import { expect, test } from '@playwright/test'
import { acceptConfirms } from './support/confirm'

// 추천 기준 옷 (BE 머지 전이라 FE 목): 자녀 프로필의 「기준 옷」 칸에서 상의를 저장 · 교체 · 삭제한다.
// 목은 자녀 · 카테고리를 가짜 백엔드에서 읽고, 저장한 값은 탭(sessionStorage)에 남는다
const API = 'http://localhost:18080/api/v1'

test('보호자는 자녀 프로필에서 상의 기준 옷을 저장하고 지운다', async ({ page, request }) => {
  const token = await request
    .post(`${API}/dev/tokens`, { data: { memberId: 1, roles: ['BUYER'] } })
    .then((res) => res.json())
  const child = await request
    .post(`${API}/children`, {
      headers: { authorization: `Bearer ${token.accessToken}` },
      data: {
        name: '기준옷',
        birthDate: '2019-01-01',
        gender: 'MALE',
        heightCm: 115,
        weightKg: 20,
        bodyType: 'NORMAL',
        preferredFit: 'LOOSE',
        requiredConsent: true,
        optionalConsent: true,
      },
    })
    .then((res) => res.json())

  await acceptConfirms(page)
  await page.goto('/login')
  await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
  await expect(page.getByText('보호자 · 회원 1')).toBeVisible()

  await test.step('맞춤 목록 머리말에서 기준 옷 칸으로 간다', async () => {
    await page.goto(`/recommended/${child.id}`)
    await page.getByRole('link', { name: '잘 맞는 옷(기준 옷) 적기' }).click()
    await expect(page).toHaveURL(new RegExp(`/my/children/${child.id}#reference-garments$`))
    await expect(page.getByRole('heading', { name: '기준 옷' })).toBeVisible()
  })

  const top = page.getByRole('form', { name: '상의 기준 옷' })
  await test.step('필수 실측이 없거나 값이 틀리면 저장 전에 막는다', async () => {
    await expect(top.getByText('아직 저장한 기준 옷이 없어요.')).toBeVisible()
    // 상의 칸은 상의 카테고리만 고를 수 있다
    await expect(top.getByLabel('세부 종류').locator('option', { hasText: '하의' })).toHaveCount(0)
    await top.getByLabel('세부 종류').selectOption({ label: '의류 > 상의' })
    await top.getByLabel('총장 (cm, 필수)').fill('42')
    await top.getByRole('button', { name: '저장하기' }).click()
    await expect(top.getByText('가슴단면은 꼭 입력해 주세요.')).toBeVisible()
    await top.getByLabel('가슴단면 (cm, 필수)').fill('34.55')
    await top.getByRole('button', { name: '저장하기' }).click()
    await expect(
      top.getByText('실측 값은 0cm보다 크고 200cm 이하로, 소수 첫째 자리까지 입력해 주세요.'),
    ).toBeVisible()
  })

  await test.step('저장하면 요약에 보이고 새로고침해도 남는다', async () => {
    await top.getByLabel('가슴단면 (cm, 필수)').fill('34.5')
    await top.getByLabel('어깨너비 (cm)').fill('28')
    await top.getByRole('button', { name: '저장하기' }).click()
    const summary = '의류 > 상의 · 총장 42cm · 가슴단면 34.5cm · 어깨너비 28cm'
    await expect(top.getByText(summary)).toBeVisible()
    await page.reload()
    await expect(top.getByText(summary)).toBeVisible()
  })

  await test.step('선택 실측을 비우고 다시 저장하면 그 값은 사라진다', async () => {
    await top.getByLabel('어깨너비 (cm)').fill('')
    await top.getByRole('button', { name: '저장하기' }).click()
    await expect(
      top.getByText('의류 > 상의 · 총장 42cm · 가슴단면 34.5cm', { exact: true }),
    ).toBeVisible()
  })

  await test.step('지우면 빈 칸으로 돌아간다', async () => {
    await top.getByRole('button', { name: '삭제' }).click()
    await expect(top.getByText('아직 저장한 기준 옷이 없어요.')).toBeVisible()
    await expect(top.getByLabel('총장 (cm, 필수)')).toHaveValue('')
  })
})
