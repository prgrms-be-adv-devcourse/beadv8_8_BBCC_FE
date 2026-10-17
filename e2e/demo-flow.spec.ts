import { expect, test, type Page } from '@playwright/test'
import { acceptConfirms } from './support/confirm'

// 시연 콘솔(/console)에서 정상 흐름 ①~⑦을 시연 순서대로 따라가며, 화면 결과와 흐름 확인(/verify) 판정까지 확인한다.
// 가짜 백엔드(e2e/fake-backend) + FE 목(판매자 상품 목록 · 수정 등 BE에 없는 것)으로 돈다.

const NICKNAME = {
  보호자: '보호자 · 회원 1',
  판매자: '테스트상점 · 회원 2',
  관리자: '관리자 · 회원 3',
} as const

async function switchRole(page: Page, role: keyof typeof NICKNAME) {
  await page.getByRole('button', { name: role, exact: true }).first().click()
  await expect(page.getByText(NICKNAME[role])).toBeVisible()
}

test('시연 콘솔: 정상 흐름 ①~⑦', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('pageerror', (error) => consoleErrors.push(error.message))
  await acceptConfirms(page)

  await test.step('시작: 보호자로 전환', async () => {
    await page.goto('/console')
    await expect(page.getByText('Kidly 시연')).toBeVisible()
    await switchRole(page, '보호자')
  })

  await test.step('① 자녀 · 배송지 등록', async () => {
    await page.goto('/console/children')
    await page.getByRole('button', { name: '등록하기' }).click()
    await expect(page.getByText('#').first()).toBeVisible()
    await page.goto('/console/addresses')
    await page.getByRole('button', { name: '등록하기' }).click()
    await expect(page.getByText('기본', { exact: true })).toBeVisible()
  })

  await test.step('API 흐름 패널: 방금 호출 · 단계별 묶음 · 목록 | 상세 · 폭 조절', async () => {
    const latest = page.getByRole('region', { name: '방금 호출' })
    await expect(latest).toContainText('POST')
    await expect(latest).toContainText('/members/me/addresses')
    const step1 = page.getByRole('region', { name: '단계 ① 호출' }).first()
    await expect(step1).toBeVisible()
    const widthButton = (name: string) =>
      page.getByRole('group', { name: '패널 폭' }).getByRole('button', { name })
    // 요청 · 응답 보기 → 보통 폭이면 넓게로 바뀌고 오른쪽에 상세, 방금 호출 자리를 대신한다
    await latest.getByRole('button', { name: '요청 · 응답 보기' }).click()
    const detail = page.getByRole('region', { name: '선택한 호출' })
    await expect(detail).toContainText('/members/me/addresses')
    await expect(detail.getByText('응답', { exact: true })).toBeVisible()
    await expect(latest).toHaveCount(0)
    await expect(widthButton('◧ 넓게')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('region', { name: '호출 목록' })).toBeVisible()
    // Esc → 상세 닫힘, 원래 폭(보통)으로
    await page.locator('body').press('Escape')
    await expect(detail).toHaveCount(0)
    await expect(latest).toBeVisible()
    await expect(widthButton('보통')).toHaveAttribute('aria-pressed', 'true')
    // 목록 줄 클릭 → 상세, 같은 줄 다시 클릭 → 닫힘 (토글)
    const row = step1.getByRole('button', { name: /POST\s*\/members\/me\/addresses/ }).first()
    await row.click()
    await expect(row).toHaveAttribute('aria-pressed', 'true')
    await expect(detail).toBeVisible()
    await row.click()
    await expect(detail).toHaveCount(0)
    await expect(widthButton('보통')).toHaveAttribute('aria-pressed', 'true')
    // 전체: API만 화면 가득 → 다시 보통
    await widthButton('⛶ 전체').click()
    await expect(widthButton('⛶ 전체')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('region', { name: '호출 목록' })).toBeVisible()
    await widthButton('보통').click()

    // 손잡이를 끌어 폭을 맞춘다 → 프리셋 선택 표시 없음, ← 로 40px 넓힘, 더블클릭이면 보통
    const handle = page.getByRole('separator', { name: 'API 흐름 폭 조절' })
    const box = (await handle.boundingBox())!
    const viewport = page.viewportSize()!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(viewport.width - 700, box.y + box.height / 2, { steps: 5 })
    await page.mouse.up()
    await expect(handle).toHaveAttribute('aria-valuenow', /^(69\d|70\d)$/)
    for (const name of ['보통', '◧ 넓게', '⛶ 전체']) {
      await expect(widthButton(name)).toHaveAttribute('aria-pressed', 'false')
    }
    // 700px 이상이면 패널 안이 목록 | 방금 호출로 나뉜다
    await expect(page.getByRole('region', { name: '호출 목록' })).toBeVisible()
    const before = Number(await handle.getAttribute('aria-valuenow'))
    await handle.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(handle).toHaveAttribute('aria-valuenow', String(before + 40))
    await handle.dblclick()
    await expect(widthButton('보통')).toHaveAttribute('aria-pressed', 'true')
  })

  await test.step('② 판매자 신청 → 관리자 거절 → 다시 신청 → 승인', async () => {
    await page.goto('/console/seller/apply')
    await page.getByRole('button', { name: '신청하기' }).click()
    await expect(page.getByText('심사 중')).toBeVisible()
    await switchRole(page, '관리자')
    await page.goto('/console/admin/seller-applications')
    await page.getByRole('button', { name: '거절', exact: true }).click()
    await page.getByRole('textbox', { name: '거절 사유' }).fill('사업자 서류를 다시 확인해 주세요')
    await page.getByRole('button', { name: '거절하기' }).click()
    await expect(page.getByText('거절됨')).toBeVisible()

    await switchRole(page, '보호자')
    await page.goto('/console/seller/apply')
    await expect(page.getByText('거절 사유: 사업자 서류를 다시 확인해 주세요')).toBeVisible()
    await expect(page.getByText('다시 신청하기')).toBeVisible()
    await page.getByRole('button', { name: '신청하기' }).click()
    await expect(page.getByText('심사 중')).toBeVisible()

    await switchRole(page, '관리자')
    await page.goto('/console/admin/seller-applications')
    await page.getByRole('button', { name: '승인' }).click()
    await expect(page.getByText('승인됨')).toBeVisible()
  })

  await test.step('② 상품 등록 → 판매 시작 (실제 API: 카테고리 입력 항목 · 등록 · sale-status)', async () => {
    await switchRole(page, '판매자')
    await page.goto('/console/seller/products')
    // 카테고리 입력 항목을 받아 시연 값(네이비 · 110 / 120 · 면)으로 채운 폼
    await expect(page.getByRole('checkbox', { name: '네이비' })).toBeChecked()
    await expect(page.getByLabel('네이비 / 120 재고')).toHaveValue('10')
    await page.getByRole('button', { name: '등록하기' }).click()
    // 등록 결과 줄의 판매 시작 (내 상품 목록이 먼저 다시 불려 같은 버튼이 목록에도 생긴다)
    const registered = page.getByText(/상품 #\d+를 등록했어요/).locator('..')
    await registered.getByRole('button', { name: '판매 시작' }).click()
    await expect(registered.getByText('판매를 시작했어요.')).toBeVisible()
    await expect(registered.getByRole('button', { name: '판매 시작' })).toHaveCount(0)
    // 판매 시작 → 상세로 이어진다 (실제 상세 API)
    await page.getByRole('link', { name: '상품 상세 보기' }).click()
    await expect(page.getByRole('heading', { name: '데일리 맨투맨', exact: true })).toBeVisible()
    await expect(page.getByRole('table', { name: '사이즈 정보' })).toBeVisible()
  })

  await test.step('③ 자녀 맞춤 목록(목) → 방금 등록한 상품 상세 사이즈 추천', async () => {
    await switchRole(page, '보호자')
    await page.goto('/console/products')
    await page.getByRole('button', { name: /테스트 맞춤/ }).click()
    await expect(page.getByText(/추천 120/).first()).toBeVisible()
    await page.getByText('데일리 맨투맨', { exact: true }).first().click()
    // 실제 API 모양(BE #262): 추천 + 적합도 + 후보 (가짜 백엔드가 응답)
    await expect(page.getByText(/추천 사이즈 120 .*후보 110 · 120 중/)).toBeVisible()
  })

  await test.step('④ 담기 → 주문하기 → 결제 완료 (시드 상품 복사본 없이, 판매 시작이 만든 복사본으로)', async () => {
    await page.getByRole('button', { name: /네이비 \/ 120/ }).click()
    await page.getByRole('button', { name: '장바구니 담기' }).click()
    await expect(page.getByText('담았어요')).toBeVisible()
    await page.goto('/console/cart')
    await page.getByRole('button', { name: /주문하기/ }).click()
    await expect(page.getByText('결제 처리 중')).toBeVisible()
    await expect(page.getByText('결제 완료', { exact: true }).first()).toBeVisible()
    // 결제 도메인 기록(GET /payments)과 주문 상태가 맞는지
    await expect(page.getByRole('status', { name: '결제 확인' })).toContainText('일치')
  })
  const orderUrl = page.url()

  await test.step('⑤ 판매자 발송 → 배송 완료', async () => {
    await switchRole(page, '판매자')
    await page.goto('/console/seller/orders')
    await page.getByRole('button', { name: '발송' }).click()
    await page.getByRole('button', { name: '배송 완료 처리' }).click()
    await expect(page.getByText('배송 완료', { exact: true }).first()).toBeVisible()
  })

  await test.step('⑥ 구매확정', async () => {
    await switchRole(page, '보호자')
    await page.goto(orderUrl)
    await page.getByRole('button', { name: '구매확정' }).click()
    await expect(page.getByText(/구매확정$/).first()).toBeVisible()
  })

  await test.step('⑦ 정산 실행 → 정산서 · 예치금 입금 (⑥에서 구매확정한 주문상품으로)', async () => {
    // 정산 전: 판매자 정산 대상에 방금 구매확정한 주문상품이 있다 (판매자 예치금도 먼저 조회해 둔다)
    await switchRole(page, '판매자')
    await page.goto('/console/seller/settlements')
    await expect(page.getByText(/주문 #\d+ · 주문상품 #\d+ · 구매확정/)).toBeVisible()
    await switchRole(page, '관리자')
    await page.goto('/console/admin/settlements')
    // 기준일은 오늘(BE: 오늘 이후는 400) → 어제까지 구매확정분이 대상. 방금 확정한 상품을 하루 전 확정으로 옮겨 정산한다
    await expect(page.getByText(/오늘 구매확정분은 내일/).first()).toBeVisible()
    await page.request.post('http://localhost:18080/__fake/age-confirmations', {
      data: { days: 1 },
    })
    await page.getByRole('button', { name: '정산 실행' }).click()
    await expect(page.getByText(/정산 완료 · 성공 1 · 실패 0 · 기간/)).toBeVisible()
    await switchRole(page, '판매자')
    await page.goto('/console/seller/settlements')
    await expect(page.getByText('정산 대상이 없어요.')).toBeVisible()
    await expect(page.getByText('지급 완료', { exact: true })).toBeVisible()
    await expect(page.getByText(/지급 22,500원/)).toBeVisible()
    await page.getByRole('button', { name: '상세' }).click()
    await expect(page.getByText(/주문 #\d+ · 주문상품 #\d+ · 25,000원 · 구매확정/)).toBeVisible()
  })

  await test.step('④ 충전 승인(토스 복귀) → 충전 취소', async () => {
    await switchRole(page, '보호자')
    await page.goto('/console/wallet/charge/success?paymentKey=pk&orderId=toss-77&amount=50000')
    await expect(page.getByText(/50,000원 충전했어요/)).toBeVisible()
    await page.goto('/console/wallet')
    // 충전 내역 · 거래 내역(BE 입출금 원장) 모두 실제 API
    await expect(page.getByText(/충전 #77/)).toBeVisible()
    await expect(page.getByRole('listitem', { name: '거래 충전' })).toBeVisible()
    await expect(page.getByRole('listitem', { name: '거래 주문 결제' }).first()).toBeVisible()
    await page.getByRole('button', { name: '충전 취소' }).click()
    // 충전 내역이 다시 조회돼 '취소됨'이 되고, 거래 내역에 충전 취소가 생긴다
    await expect(page.getByText('취소됨').first()).toBeVisible()
    await expect(page.getByRole('listitem', { name: '거래 충전 취소' })).toBeVisible()
  })

  await test.step('새로고침 뒤에도 시연 역할 유지', async () => {
    await page.reload()
    await expect(page.getByText(NICKNAME.보호자)).toBeVisible()
  })

  await test.step('흐름 확인: 정상 흐름 판정', async () => {
    await page.goto('/console/verify')
    try {
      await expect(page.getByText('통과 21')).toBeVisible()
    } catch (error) {
      // CI에서 원인을 바로 보이게: 통과하지 못한 항목을 오류 메시지에 붙인다
      const pending = await page
        .locator('[data-slot="card"]')
        .filter({ has: page.getByText(/^(대기|실패)$/) })
        .allInnerTexts()
      throw new Error(`${(error as Error).message}\n통과 못 한 항목: ${JSON.stringify(pending)}`, {
        cause: error,
      })
    }
    // 첫 구역 = 정상 흐름 ①~⑦ (아래 취소 · 실패 시나리오 구역과 따로 센다)
    await expect(page.getByText('실패 0').first()).toBeVisible()
  })

  await test.step('흐름 패널: 상태 변화 · 계약 불일치 없음', async () => {
    await page.getByRole('button', { name: /^상태 변화/ }).click()
    await expect(page.getByText(/PENDING_PAYMENT → PAID/)).toBeVisible()
    await expect(page.getByRole('button', { name: /^계약 0/ })).toBeVisible()
  })

  await test.step('목 끄기 → 실제 서버로 감', async () => {
    await page.getByRole('button', { name: '목 설정' }).click()
    await page.locator('label', { hasText: '회원 보완' }).locator('input').uncheck()
    // 판매자 상호명 수정은 아직 목 → 끄면 가짜 백엔드의 없는 API 응답
    await switchRole(page, '판매자')
    await page.goto('/center')
    await page.getByRole('button', { name: '상호명 수정' }).click()
    await page.getByRole('textbox', { name: '상호명' }).fill('목 끈 상점')
    await page.getByRole('button', { name: '상호명 저장' }).click()
    await expect(page.getByRole('main').getByText(/없는 API PATCH \/seller\/me/)).toBeVisible()
    // 방금 호출 카드에도 실패로 크게 (판매자 센터에서는 흐름 패널을 서랍으로 연다)
    await page.getByRole('button', { name: /^API 흐름 \d+/ }).click()
    await expect(page.getByRole('region', { name: '방금 호출' })).toContainText('404')
  })

  expect(consoleErrors).toEqual([])
})
