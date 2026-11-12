import { expect, test, type APIRequestContext } from '@playwright/test'
import { signInAdmin } from './support/admin'
import { acceptConfirms } from './support/confirm'

// 관리자 처리 실패 메시지 (BE #962): 메뉴 → 목록 → 상세 → 재처리.
// 재처리하면 상태가 바뀌어 다음 실행에 다시 쓸 수 없으므로, 가짜 백엔드에 실행마다 새 메시지를 만든다
async function newDeadLetter(request: APIRequestContext, failOnReplay: boolean, module = 'member') {
  const response = await request.post('http://localhost:18080/api/v1/__fake/dead-letters', {
    data: { module, failOnReplay },
  })
  return ((await response.json()) as { deadLetterId: string }).deadLetterId
}

test('관리자 처리 실패 메시지: 목록 → 상세 → 재처리 성공 · 다시 실패', async ({
  page,
  request,
}) => {
  const fixableId = await newDeadLetter(request, false)
  const brokenId = await newDeadLetter(request, true)
  await acceptConfirms(page)
  await signInAdmin(page)

  await test.step('메뉴 → 회원 모듈의 처리 대기 목록', async () => {
    await page
      .getByRole('navigation', { name: '관리자 메뉴' })
      .getByRole('link', { name: '처리 실패 메시지' })
      .click()
    await expect(page.getByRole('heading', { name: '처리 실패 메시지', level: 1 })).toBeVisible()
    await page.getByRole('tab', { name: '회원' }).click()
    await expect(page).toHaveURL(/module=member/)
    await expect(page.getByRole('button', { name: '처리 대기' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  await test.step('상세에서 재처리하면 재처리 완료로 바뀌고 버튼이 사라진다', async () => {
    await page.getByRole('link', { name: `메시지 ${fixableId}`, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/admin/dead-letters/member/${fixableId}$`))
    const state = page.getByRole('region', { name: '처리 상태' })
    await expect(state.getByRole('heading', { name: '처리 대기' })).toBeVisible()
    await state.getByRole('button', { name: '재처리' }).click()
    await expect(state.getByRole('status')).toHaveText('재처리했어요.')
    await expect(state.getByRole('heading', { name: '재처리 완료' })).toBeVisible()
    await expect(state.getByRole('button', { name: '재처리' })).toHaveCount(0)
    await expect(page.getByRole('region', { name: '재처리 기록' })).toContainText('1회')
  })

  await test.step('목록으로 돌아오면 고른 모듈이 그대로고, 재처리 완료 쪽에 보인다', async () => {
    // 메뉴가 아니라 상세의 뒤로 링크 (목록 검색 값을 넘겨받아 돌아간다)
    await page.getByRole('main').getByRole('link', { name: '처리 실패 메시지' }).click()
    await expect(page.getByRole('tab', { name: '회원' })).toHaveAttribute('aria-selected', 'true')
    const table = page.getByRole('table', { name: '처리 실패 메시지' })
    await expect(table.getByRole('link', { name: `메시지 ${fixableId}`, exact: true })).toHaveCount(
      0,
    )
    await page.getByRole('button', { name: '재처리 완료' }).click()
    await expect(
      table.getByRole('link', { name: `메시지 ${fixableId}`, exact: true }),
    ).toBeVisible()
  })

  await test.step('처리기가 다시 실패하면 처리 대기로 남고 실패 예외를 보여 준다', async () => {
    await page.getByRole('button', { name: '처리 대기' }).click()
    await page.getByRole('link', { name: `메시지 ${brokenId}`, exact: true }).click()
    const state = page.getByRole('region', { name: '처리 상태' })
    await state.getByRole('button', { name: '재처리' }).click()
    await expect(state.getByRole('status')).toHaveText(
      '다시 처리하지 못했어요. 실패 예외: java.lang.IllegalStateException',
    )
    await expect(state.getByRole('heading', { name: '처리 대기' })).toBeVisible()
    await expect(state.getByRole('button', { name: '재처리' })).toBeEnabled()
    await expect(page.getByRole('region', { name: '재처리 기록' })).toContainText(
      'java.lang.IllegalStateException',
    )
  })
})

test('모르는 모듈의 상세 주소는 다른 모듈 메시지로 읽지 않고 없는 메시지로 보여 준다', async ({
  page,
  request,
}) => {
  const id = await newDeadLetter(request, false)
  await signInAdmin(page)
  await page.goto(`/admin/dead-letters/payment/${id}`)
  await expect(page.getByText('없는 메시지예요.')).toBeVisible()
  await expect(page.getByRole('button', { name: '재처리' })).toHaveCount(0)
})

test('커뮤니티 처리 실패 메시지도 같은 화면에서 보고 재처리한다', async ({ page, request }) => {
  const id = await newDeadLetter(request, false, 'community')
  await acceptConfirms(page)
  await signInAdmin(page)
  await page.goto('/admin/dead-letters')
  await page.getByRole('tab', { name: '커뮤니티' }).click()
  await expect(page).toHaveURL(/module=community/)
  await page.getByRole('link', { name: `메시지 ${id}`, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/admin/dead-letters/community/${id}$`))
  const state = page.getByRole('region', { name: '처리 상태' })
  await state.getByRole('button', { name: '재처리' }).click()
  await expect(state.getByRole('status')).toHaveText('재처리했어요.')
})

test('주문 처리 실패 메시지: 결제 표시 → 상세 재처리 · 메모 남기고 확인 후 종료', async ({
  page,
  request,
}) => {
  const create = async (failOnReplay: boolean) =>
    (
      (await (
        await request.post('http://localhost:18080/api/v1/__fake/order-dead-letters', {
          data: { failOnReplay },
        })
      ).json()) as { deadLetterId: string }
    ).deadLetterId
  const fixableId = await create(false)
  const brokenId = await create(true)
  await acceptConfirms(page)
  await signInAdmin(page)
  await page.goto('/admin/dead-letters')
  await page.getByRole('tab', { name: '주문' }).click()
  await expect(page).toHaveURL(/module=order/)
  const table = page.getByRole('table', { name: '주문 처리 실패 메시지' })
  const row = table.getByRole('row').filter({ hasText: `메시지 ${fixableId}` })
  await expect(row).toContainText('결제')
  await expect(row).toContainText('처리 실패')

  await row.getByRole('link', { name: `메시지 ${fixableId}`, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/admin/dead-letters/order/${fixableId}$`))
  const state = page.getByRole('region', { name: '처리 상태' })
  await expect(state).toContainText('권장 조치')
  await state.getByRole('button', { name: '재처리' }).click()
  await expect(state.getByRole('status')).toHaveText('재처리했어요.')
  await expect(state.getByRole('heading', { name: '재처리 완료' })).toBeVisible()
  await expect(state.getByRole('button', { name: '확인 후 종료' })).toHaveCount(0)

  await page.goto(`/admin/dead-letters/order/${brokenId}`)
  const brokenState = page.getByRole('region', { name: '처리 상태' })
  await brokenState.getByRole('button', { name: '확인 후 종료' }).click()
  await expect(brokenState.getByText('확인한 내용이나 종료 이유를 적어 주세요.')).toBeVisible()
  await brokenState.getByLabel('확인 후 종료 메모').fill('결제 반영을 확인했어요')
  await brokenState.getByRole('button', { name: '확인 후 종료' }).click()
  await expect(brokenState.getByRole('status')).toHaveText('확인 후 종료했어요.')
  await expect(brokenState.getByRole('heading', { name: '확인 후 종료' })).toBeVisible()
  await expect(page.getByRole('region', { name: '처리 기록' })).toContainText(
    '결제 반영을 확인했어요',
  )
})
