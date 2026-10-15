import { expect, test, type Page } from '@playwright/test'

// 사용자 화면(쇼핑 · 판매자 센터 · 관리자)으로 같은 흐름을 따라간다.
// 시연 콘솔 테스트와 가짜 백엔드를 같이 쓰므로, 앞선 테스트가 남긴 데이터가 있어도 통과하게 쓴다.

const NICKNAME = {
  보호자: '보호자 · 회원 1',
  판매자: '테스트상점 · 회원 2',
  관리자: '관리자 · 회원 3',
} as const

async function switchRole(page: Page, role: keyof typeof NICKNAME) {
  await page.getByRole('button', { name: role, exact: true }).first().click()
  await expect(page.getByText(NICKNAME[role])).toBeVisible()
}

test('사용자 화면: 상품 등록 → 쇼핑 주문 → 발송 → 구매확정', async ({ page }) => {
  const pageErrors: string[] = []
  const warnings: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text().includes('HydrateFallback'))
      warnings.push(message.text())
  })
  page.on('dialog', (dialog) => dialog.accept())

  await test.step('로그인 전: 상품은 보고, 장바구니는 로그인 뒤 원래 화면으로 (기획서 F01 · F03)', async () => {
    await page.goto('/products/1')
    await expect(page.getByText('데일리 맨투맨 (상품 A)').first()).toBeVisible()
    await expect(page.getByRole('link', { name: '로그인하고 담기' })).toHaveAttribute(
      'href',
      '/login?next=%2Fproducts%2F1',
    )
    await page.goto('/cart')
    await expect(page).toHaveURL(/\/login\?next=%2Fcart$/)
    await expect(page.getByText('로그인하면 보던 화면으로 돌아가요.')).toBeVisible()
    await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(page.getByRole('heading', { name: '장바구니' })).toBeVisible()
  })

  await test.step('관리자 영역: 관리자가 아니면 안내', async () => {
    await page.goto('/admin')
    await switchRole(page, '보호자')
    await expect(page.getByText('관리자 계정으로 볼 수 있는 화면이에요.')).toBeVisible()
  })

  await test.step('판매자 센터: 상품 등록 → 판매 시작 (실제 API)', async () => {
    await switchRole(page, '판매자')
    await page.goto('/center/products')
    await expect(page.getByRole('heading', { name: '상품 관리' })).toBeVisible()
    // 단계 번호 · 백엔드 설명은 콘솔에서만 보인다
    await expect(page.getByText('product.changed')).toHaveCount(0)
    await page.getByRole('button', { name: '등록하기' }).click()
    await page.getByRole('button', { name: '판매 시작' }).first().click()
    await expect(page.getByRole('button', { name: '판매 시작' })).toHaveCount(0)
  })

  await test.step('판매자 센터: 상품 수정 · 재고 조정 · 판매 중지 → 다시 판매 (목)', async () => {
    const mine = page.locator('[data-slot="card"]').last()
    await mine.getByRole('button', { name: '수정' }).click()
    await mine.getByLabel('상품명').fill('데일리 맨투맨 (수정)')
    await mine.getByRole('button', { name: '수정 저장' }).click()
    await expect(mine.getByText(/데일리 맨투맨 \(수정\)/)).toBeVisible()
    await mine.getByRole('button', { name: '재고 조정' }).first().click()
    await mine.getByLabel('네이비 / 110 증감 수량').fill('5')
    await mine.getByRole('button', { name: '조정', exact: true }).click()
    await expect(mine.getByText('재고 15')).toBeVisible()
    await mine.getByRole('button', { name: '판매 중지' }).click()
    await expect(mine.getByRole('button', { name: '판매 시작' })).toBeVisible()
    await mine.getByRole('button', { name: '판매 시작' }).click()
    await expect(mine.getByRole('button', { name: '판매 중지' })).toBeVisible()
  })

  await test.step('마이페이지: 자녀 · 배송지 등록', async () => {
    await switchRole(page, '보호자')
    await page.goto('/my/children')
    await page.getByRole('button', { name: '등록하기' }).click()
    await expect(page.getByText('#').first()).toBeVisible()
    await page.goto('/my/addresses')
    await page.getByRole('button', { name: '등록하기' }).click()
    await expect(page.getByText('기본', { exact: true }).first()).toBeVisible()
  })

  await test.step('마이페이지: 자녀 수정 → 성장 이력 · 이력 수정(목) · 배송지 수정', async () => {
    await page.goto('/my/children')
    await page
      .getByRole('link', { name: /테스트 상세/ })
      .first()
      .click()
    await expect(page.getByRole('heading', { name: '테스트 프로필' })).toBeVisible()
    await page.getByLabel('키 (cm)').fill('118')
    await page.getByRole('button', { name: '저장하기' }).click()
    await expect(page.getByText(/저장했어요/)).toBeVisible()
    await expect(page.getByText(/처음보다 \+3\.0cm/)).toBeVisible()
    await page.getByRole('listitem').getByRole('button', { name: '수정' }).first().click()
    await page.getByLabel('기록 키').fill('117')
    await page.getByRole('button', { name: '저장', exact: true }).click()
    await expect(page.getByText(/117\.0cm/)).toBeVisible()

    await page.goto('/my/addresses')
    await page.getByRole('button', { name: '수정' }).first().click()
    await expect(page.getByText('배송지 수정')).toBeVisible()
    await page.getByRole('button', { name: '저장하기' }).click()
    await expect(page.getByText('배송지 수정')).toHaveCount(0)
  })

  await test.step('쇼핑: 상품 검색 · 카테고리 (목)', async () => {
    await page.getByRole('link', { name: 'Kidly', exact: true }).click()
    await page.getByRole('textbox', { name: '상품 검색' }).fill('조거')
    await page.getByRole('button', { name: '검색' }).click()
    await expect(page.getByText('밴딩 조거 팬츠 (상품 B)')).toBeVisible()
    await expect(page.getByText('데일리 맨투맨 (상품 A)')).toHaveCount(0)
    await page.getByRole('textbox', { name: '상품 검색' }).fill('')
    await page.getByRole('button', { name: '검색' }).click()
    await page.getByRole('button', { name: '상의', exact: true }).click()
    await expect(page.getByText('데일리 맨투맨 (상품 A)')).toBeVisible()
    await expect(page.getByText('밴딩 조거 팬츠 (상품 B)')).toHaveCount(0)
    await page.getByRole('button', { name: '전체 카테고리' }).click()
  })

  await test.step('쇼핑: 자녀 맞춤 상품 → 상세 추천 → 담기', async () => {
    await page.getByRole('link', { name: 'Kidly', exact: true }).click()
    await page
      .getByRole('button', { name: /테스트 맞춤/ })
      .first()
      .click()
    await expect(page.getByText(/테스트에게 맞는 상품/)).toBeVisible()
    await page.getByText('데일리 맨투맨 (상품 A)').first().click()
    await expect(page.getByText('추천 사이즈')).toBeVisible()
    await page.getByRole('button', { name: /네이비 \/ 120/ }).click()
    await page.getByRole('button', { name: '장바구니 담기' }).click()
    await page.getByRole('link', { name: '장바구니 보기' }).click()
    await expect(page).toHaveURL(/\/cart$/)
  })

  await test.step('쇼핑: 주문하기 → 진행 막대가 결제 완료로', async () => {
    await page.getByRole('button', { name: /주문하기/ }).click()
    await expect(page).toHaveURL(/\/orders\/\d+$/)
    await expect(page.getByRole('list', { name: '주문 진행' })).toBeVisible()
    await expect(page.locator('[aria-current="step"]')).toHaveText('2')
    await expect(page.getByRole('status', { name: '결제 확인' })).toContainText('일치')
  })
  const orderUrl = page.url()

  await test.step('흐름 서랍: 쇼핑에서도 API 호출을 본다', async () => {
    await page.getByRole('button', { name: /^API 흐름 \d+/ }).click()
    await expect(page.getByText('도메인 흐름')).toBeVisible()
    await expect(page.getByText('/orders', { exact: true }).first()).toBeVisible()
    await page.getByRole('button', { name: '닫기 ✕' }).click()
  })

  await test.step('판매자 센터: 홈 할 일 → 발송 → 배송 완료', async () => {
    await switchRole(page, '판매자')
    await page.goto('/center')
    await expect(page.getByText('발송할 주문')).toBeVisible()
    await expect(page.getByText('테스트상점').first()).toBeVisible()
    await expect(page.getByText('판매 가능')).toBeVisible()
    await page.getByRole('button', { name: '상호명 수정' }).click()
    await page.getByRole('textbox', { name: '상호명' }).fill('테스트상점 본점')
    await page.getByRole('button', { name: '상호명 저장' }).click()
    await expect(page.getByText('테스트상점 본점')).toBeVisible()
    await page.getByRole('link', { name: '주문 · 배송' }).click()
    await page.getByRole('button', { name: '발송' }).first().click()
    await page.getByRole('button', { name: '배송 완료 처리' }).first().click()
    await expect(page.getByText('배송 완료', { exact: true }).first()).toBeVisible()
  })

  await test.step('쇼핑: 구매확정 → 진행 막대 끝까지', async () => {
    await switchRole(page, '보호자')
    await page.goto(orderUrl)
    await expect(page.locator('[aria-current="step"]')).toHaveText('4')
    await page.getByRole('button', { name: '구매확정' }).click()
    await expect(page.locator('[aria-current="step"]')).toHaveText('5')
  })

  await test.step('취소 · 실패: 재고 부족 → 잔액 부족 (기획서 2.1)', async () => {
    const order = async (productId: string, option: RegExp, quantity: string) => {
      await page.goto(`/products/${productId}`)
      await page.getByRole('button', { name: option }).click()
      await page.getByRole('spinbutton').fill(quantity)
      await page.getByRole('button', { name: '장바구니 담기' }).click()
      await page.getByRole('link', { name: '장바구니 보기' }).click()
      await page.getByRole('button', { name: /주문하기/ }).click()
      await expect(page).toHaveURL(/\/orders\/\d+$/)
    }
    // 상품 B 재고 5개보다 많이 → 재고 부족 취소
    await order('2', /그레이 \/ 120/, '6')
    await expect(page.getByText(/구매할 수 없는 상품이 있어/)).toBeVisible()
    await expect(page.getByRole('link', { name: '장바구니에서 다시 확인하기' })).toBeVisible()
    // 잔액보다 큰 금액 → 결제 실패 취소 · 결제 도메인 실패 기록
    await order('1', /네이비 \/ 110/, '8')
    await expect(page.getByText(/예치금 결제에 실패했어요/)).toBeVisible()
    await expect(page.getByRole('status', { name: '결제 확인' })).toContainText('일치')

    await page.goto('/console/verify')
    const failure = page.getByRole('region', { name: '취소 · 실패 시나리오' })
    await expect(failure.getByText('통과 3')).toBeVisible()
    await expect(failure.getByText('실패 0')).toBeVisible()
    await page.goto('/')
  })

  await test.step('쇼핑: 선택 주문 · 부족한 만큼 충전하고 돌아오기 (기획서 F05 · F06)', async () => {
    await page.goto('/products/1')
    await page.getByRole('button', { name: /네이비 \/ 110/ }).click()
    await page.getByRole('spinbutton').fill('8')
    await page.getByRole('button', { name: '장바구니 담기' }).click()
    await page.getByRole('link', { name: '장바구니 보기' }).click()

    // 잔액보다 큰 금액 → 부족 금액을 천 원 단위로 채워 충전하러 가는 링크
    const charge = page.getByRole('link', { name: /충전하고 돌아오기/ })
    await expect(charge).toHaveAttribute('href', /\/my\/wallet\?amount=\d+000&return=%2Fcart/)

    // 선택을 빼면 주문할 상품이 없어 주문하기가 막힌다
    await page.getByRole('checkbox', { name: /데일리 맨투맨.*110 주문하기/ }).uncheck()
    await expect(page.getByText('선택한 상품 0개')).toBeVisible()
    await expect(page.getByRole('button', { name: /주문하기/ })).toBeDisabled()
    await page.getByRole('checkbox', { name: /전체 선택/ }).check()
    await expect(page.getByText('선택한 상품 1개')).toBeVisible()

    // 예치금 화면: 금액이 채워져 있고, 충전 뒤 주문서로 돌아갈 수 있다고 안내
    await charge.click()
    await expect(page.getByRole('spinbutton')).not.toHaveValue('50000')
    await expect(page.getByText(/"주문서로 돌아가기"를 눌러 돌아갈 수 있어요/)).toBeVisible()

    // 토스에서 돌아온 승인 화면 (결제창 이동 대신 저장 값으로 흉내) → 주문서로 돌아가기
    await page.evaluate(() =>
      sessionStorage.setItem(
        'kidly.charge-return',
        JSON.stringify({ path: '/cart', label: '주문서로 돌아가기' }),
      ),
    )
    await page.goto('/my/wallet/charge/success?paymentKey=pk&orderId=toss-88&amount=1000')
    await page.getByRole('link', { name: '주문서로 돌아가기' }).click()
    await expect(page).toHaveURL(/\/cart$/)

    // 다음 단계에 남지 않게 장바구니를 비운다
    await page.getByRole('button', { name: '빼기' }).click()
    await expect(page.getByText('장바구니가 비었어요.')).toBeVisible()
    await page.goto('/')
  })

  await test.step('마이페이지 · 주문 내역', async () => {
    await page.getByRole('link', { name: '마이페이지' }).click()
    await expect(page.getByText('예치금').first()).toBeVisible()
    await expect(page.getByText('최근 결제 내역')).toBeVisible()
    await expect(page.getByText('결제 완료').first()).toBeVisible()
    await page.getByRole('link', { name: '주문 내역' }).first().click()
    await expect(page.getByText(/주문번호/).first()).toBeVisible()
  })

  await test.step('관리자: 회원 관리 · 판매자 자격 정지 · 전체 주문 · 결제 · 정산 재처리', async () => {
    await switchRole(page, '관리자')
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: '회원 관리' })).toBeVisible()
    await page.getByRole('button', { name: '판매자', exact: true }).nth(1).click()
    await page.getByRole('textbox', { name: '회원 검색' }).fill('테스트')
    await page.getByRole('button', { name: '검색' }).click()
    await page.getByRole('button', { name: '판매자 자격 정지' }).click()
    await page.getByRole('textbox', { name: '판매자 정지 사유' }).fill('정책 위반 상품 반복 등록')
    await page.getByRole('button', { name: '자격 정지하기' }).click()
    await expect(page.getByText('판매자 자격 정지', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: '상품 관리' }).click()
    const target = page.locator('[data-slot="card"]').filter({ hasText: '데일리 맨투맨 (수정)' })
    await target.getByRole('button', { name: '판매 중지' }).click()
    await target.getByRole('textbox', { name: '판매 중지 사유' }).fill('상품 정보 허위 기재')
    await target.getByRole('button', { name: '중지하기' }).click()
    await expect(page.getByText('데일리 맨투맨 (수정)')).toHaveCount(0)

    await page.getByRole('link', { name: '전체 주문' }).click()
    await expect(page.getByText(/^주문 \d+$/).first()).toBeVisible()
    await page.getByRole('link', { name: '전체 결제' }).click()
    await expect(page.getByText('결제 완료').first()).toBeVisible()

    await page.getByRole('link', { name: '정산', exact: true }).click()
    await page.getByLabel(/적립 실패를 흉내/).check()
    await page.getByRole('button', { name: '정산 실행' }).click()
    await expect(page.getByText('적립 실패')).toBeVisible()
    await page.getByRole('button', { name: '재처리' }).click()
    await expect(page.getByText('정산 완료', { exact: true })).toBeVisible()
    await switchRole(page, '보호자')
  })

  await test.step('내 정보: 닉네임 수정 → 토큰 다시 받기 → 탈퇴(목)', async () => {
    await page.goto('/my/profile')
    await page.getByLabel(/닉네임/).fill('보호자맘')
    await page.getByRole('button', { name: '닉네임 바꾸기' }).click()
    await expect(page.getByText('보호자맘 · 회원 1').first()).toBeVisible()
    await page.getByRole('button', { name: '탈퇴하기' }).click()
    await expect(page.getByText('로그인 전')).toBeVisible()
  })

  expect(pageErrors).toEqual([])
  expect(warnings).toEqual([])
})
