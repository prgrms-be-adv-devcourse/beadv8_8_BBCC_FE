import { expect, test, type Page } from '@playwright/test'
import { acceptConfirms } from './support/confirm'

// 사용자 화면(쇼핑 · 판매자 센터 · 관리자)으로 같은 흐름을 따라간다.
// 시연 콘솔 테스트와 가짜 백엔드를 같이 쓰므로, 앞선 테스트가 남긴 데이터가 있어도 통과하게 쓴다.

const NICKNAME = {
  보호자: '보호자 · 회원 1',
  판매자: '테스트상점 · 회원 2',
  관리자: '관리자 · 회원 3',
} as const

/** 가짜 백엔드가 발급하는 저장 주소. 확장자는 발급 때 보낸 형식(줄인 결과 JPG)에서 정해진다 */
const BUCKET_IMAGE =
  /^https:\/\/team04-kidly-s3\.s3\.ap-northeast-2\.amazonaws\.com\/dev\/products\/\d+\/[\w-]+\.jpg$/

/** 브라우저에서 그린 단색 PNG (업로드할 사진) */
async function pngOf(page: Page, width: number, height: number): Promise<Buffer> {
  const bytes = await page.evaluate(
    async ([w, h]) => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const context = canvas.getContext('2d')
      if (!context) throw new Error('canvas 없음')
      context.fillStyle = '#681078'
      context.fillRect(0, 0, w, h)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('PNG를 만들지 못함')
      return Array.from(new Uint8Array(await blob.arrayBuffer()))
    },
    [width, height] as const,
  )
  return Buffer.from(bytes)
}

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
  await acceptConfirms(page)
  // S3는 브라우저가 직접 부른다. 외부로 나가지 않게 가로채서, 업로드(PUT)는 받아 주고
  // 이미지 조회는 막는다 (파일이 없으므로 화면은 기본 이미지를 보여 준다)
  await page.route('https://team04-kidly-s3.s3.ap-northeast-2.amazonaws.com/**', (route) =>
    route.request().method() === 'GET'
      ? route.abort()
      : route.fulfill({
          status: 200,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'PUT',
            'access-control-allow-headers': '*',
          },
        }),
  )

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

  await test.step('판매자 센터: 사진 업로드(목) → 상품 등록 → 판매 시작 (실제 API)', async () => {
    await switchRole(page, '판매자')
    await page.goto('/center/products')
    await expect(page.getByRole('heading', { name: '상품 관리' })).toBeVisible()
    // 단계 번호 · 백엔드 설명은 콘솔에서만 보인다
    await expect(page.getByText('product.changed')).toHaveCount(0)
    // 긴 변 2400px PNG를 고르면 JPG로 줄여 발급받고(가짜 백엔드), 받은 주소로 S3에 PUT한다
    const uploaded = page.waitForRequest(
      (request) => request.method() === 'PUT' && request.url().includes('X-Amz-Signature='),
    )
    await page.getByLabel(/상품 사진/).setInputFiles({
      name: 'photo.png',
      mimeType: 'image/png',
      buffer: await pngOf(page, 2400, 1200),
    })
    // 서명에 맞게 줄인 형식을 그대로 보내고, 토큰은 S3로 보내지 않는다
    const put = await uploaded
    expect(put.headers()['content-type']).toBe('image/jpeg')
    expect(put.headers().authorization).toBeUndefined()
    await expect(page.getByRole('img', { name: '상품 사진 1' })).toBeVisible()
    await expect(page.getByText('대표', { exact: true })).toBeVisible()
    const registering = page.waitForRequest(
      (request) => request.method() === 'POST' && request.url().endsWith('/seller/products'),
    )
    await page.getByRole('button', { name: '등록하기' }).click()
    const body = (await registering).postDataJSON() as {
      thumbnailUrl: string
      imageUrls: string[]
    }
    expect(body.imageUrls).toHaveLength(1)
    expect(body.thumbnailUrl).toBe(body.imageUrls[0])
    expect(body.thumbnailUrl).toMatch(BUCKET_IMAGE)
    // 등록 결과 줄의 판매 시작 (내 상품 목록이 먼저 다시 불려 같은 버튼이 목록에도 생긴다)
    const registered = page.getByText(/상품 #\d+를 등록했어요/).locator('..')
    await registered.getByRole('button', { name: '판매 시작' }).click()
    await expect(registered.getByText('판매를 시작했어요.')).toBeVisible()
    await expect(page.getByRole('button', { name: '판매 시작' })).toHaveCount(0)
  })

  await test.step('판매자 센터: 상품 수정 · 사진 더하기 · 재고 조정 · 판매 중지 → 다시 판매 (실제 API)', async () => {
    // 내 상품은 등록 최신순 → 방금 등록한 상품이 맨 위
    const mine = page
      .locator('[data-slot="card"]')
      .filter({ hasText: /상품 #\d+ · 옵션/ })
      .first()
    // 수정 폼은 등록과 같은 칸을 지금 값으로 채운다. 판매 중이라 옵션 · 판매가 · 실측은 잠긴다
    await mine.getByRole('button', { name: '수정' }).click()
    await expect(mine.getByText(/판매를 시작한 상품은 옵션/)).toBeVisible()
    await expect(mine.getByLabel('상품명')).toHaveValue(/데일리 맨투맨/)
    await expect(mine.getByRole('img', { name: '상품 사진 1' })).toBeVisible()
    await mine.getByLabel('상품명').fill('데일리 맨투맨 (수정)')
    // 지금 사진 뒤에 새 사진을 더한다
    await mine.getByLabel(/^상품 사진 \(/).setInputFiles({
      name: 'photo-2.png',
      mimeType: 'image/png',
      buffer: await pngOf(page, 800, 600),
    })
    await expect(mine.getByRole('img', { name: '상품 사진 2' })).toBeVisible()
    const updating = page.waitForRequest(
      (request) => request.method() === 'PUT' && /\/seller\/products\/\d+$/.test(request.url()),
    )
    await mine.getByRole('button', { name: '수정 저장' }).click()
    const update = (await updating).postDataJSON() as {
      name: string
      imageUrls: string[]
      options: unknown
      prices: unknown
      sizeSpecs: unknown
    }
    expect(update.name).toBe('데일리 맨투맨 (수정)')
    expect(update.imageUrls).toHaveLength(2)
    expect([update.options, update.prices, update.sizeSpecs]).toEqual([null, null, null])
    await expect(mine.getByRole('button', { name: '수정 저장' })).toHaveCount(0)
    await expect(mine.getByText('데일리 맨투맨 (수정)')).toBeVisible()
    await mine.getByRole('button', { name: '재고 조정' }).first().click()
    await mine.getByLabel('네이비 / 110 증감 수량').fill('5')
    await mine.getByRole('button', { name: '조정', exact: true }).click()
    await expect(mine.getByText('재고 15')).toBeVisible()
    // 재고 적은 상품만 (상품 B 재고 5)
    // 거르기는 주소(?stock=low)에 저장돼 조금 늦게 체크되므로 click 뒤 상태를 기다린다
    const lowOnly = page.getByRole('checkbox', { name: '재고 적은 상품만' })
    await lowOnly.click()
    await expect(lowOnly).toBeChecked()
    await expect(page.getByText('밴딩 조거 팬츠 (상품 B)')).toBeVisible()
    await expect(page.getByText(/^(재고 적음|품절)$/).first()).toBeVisible()
    await lowOnly.click()
    await expect(lowOnly).not.toBeChecked()
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
    // 성장 그래프: 지금 키의 사이즈 구간 (기록이 같은 날뿐이라 다음 사이즈 예고는 아직 없음)
    await expect(
      page.getByRole('img', { name: /키 기록 \d+개, 지금 118cm는 120 사이즈 구간/ }),
    ).toBeVisible()
    await expect(page.getByText(/한 달 이상 떨어진 키 기록이 2개 넘게 쌓이면/)).toBeVisible()
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

  await test.step('쇼핑: 상품 검색 · 카테고리 · 정렬 · 옵션 거르기 (GET /products, 가짜 백엔드)', async () => {
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
    await expect(page).not.toHaveURL(/cat=/)

    // 정렬 (BE sort): 낮은 가격순이면 A(25,000원)가 B(30,000원)보다 앞
    await page.getByRole('combobox', { name: '정렬' }).selectOption('PRICE_ASC')
    // 거르기는 주소에 남는다 (상세에서 뒤로 와도 유지)
    await expect(page).toHaveURL(/sort=PRICE_ASC/)
    const names = page.getByText(/\(상품 [AB]\)$/)
    await expect(names.first()).toHaveText('데일리 맨투맨 (상품 A)')
    await page.getByRole('combobox', { name: '정렬' }).selectOption('PRICE_DESC')
    await expect(page).toHaveURL(/sort=PRICE_DESC/)
    await expect(names.first()).toHaveText('밴딩 조거 팬츠 (상품 B)')
    await page.getByRole('combobox', { name: '정렬' }).selectOption('NEWEST')

    // 옵션 값 거르기 (BE attributes): 하의 + 색상 그레이 → B만, 네이비로 바꾸면 없음
    await page.getByRole('button', { name: '하의', exact: true }).click()
    const color = page.getByRole('group', { name: '색상 거르기' })
    await color.getByRole('button', { name: '그레이' }).click()
    await expect(page.getByText('밴딩 조거 팬츠 (상품 B)')).toBeVisible()
    await color.getByRole('button', { name: '그레이' }).click()
    await color.getByRole('button', { name: '네이비' }).click()
    await expect(page.getByText('조건에 맞는 상품이 없어요.')).toBeVisible()
    await page.getByRole('button', { name: '거르기 지우기' }).click()
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
    await expect(page).toHaveURL(/\/products\/\d+\?childId=/)
    await expect(page.getByText('추천 사이즈')).toBeVisible()
    // 착용 미리보기: 추천 사이즈로 시작, 사이즈를 바꾸면 그림 · 문구가 바뀐다
    await expect(
      page.getByRole('img', { name: /키 118cm에 120 사이즈: 엉덩이를 덮어요/ }),
    ).toBeVisible()
    await page
      .getByRole('group', { name: '미리볼 사이즈' })
      .getByRole('button', { name: '110' })
      .click()
    await expect(page.getByRole('img', { name: /키 118cm에 110 사이즈/ })).toBeVisible()
    await page.getByRole('button', { name: /네이비 \/ 120/ }).click()
    await page.getByRole('button', { name: '장바구니 담기' }).click()
    // 머리말 장바구니 개수 배지
    await expect(page.getByRole('link', { name: /장바구니 \d+개/ })).toBeVisible()
    await page.getByRole('link', { name: '장바구니 보기' }).click()
    await expect(page).toHaveURL(/\/cart$/)
    // 판매자별 묶음 이름은 상호명 (BE sellerName)
    await expect(page.getByRole('region', { name: '테스트상점' })).toBeVisible()
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
    // 맨 위 "방금 호출" 카드, 흐름도는 접혀 있어 펼쳐서 본다
    await expect(page.getByRole('region', { name: '방금 호출' })).toBeVisible()
    await page.getByRole('button', { name: /서버 이벤트 흐름도/ }).click()
    // 서버 이벤트 흐름 그림: 주문하기 뒤 실제 결과(결제 완료)까지 이벤트 순서대로
    await expect(page.getByRole('heading', { name: '서버 이벤트 흐름' })).toBeVisible()
    await expect(
      page.getByRole('img', { name: /order\.created → stock\.deducted → .* → payment\.completed/ }),
    ).toBeVisible()
    await expect(page.getByText(/결제 완료 · [\d.]+초/)).toBeVisible()
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
    // 할 일 타일 → 그 탭으로 바로
    await page.getByRole('link', { name: /발송할 주문/ }).click()
    await expect(page).toHaveURL(/\/center\/orders\?tab=READY$/)
    await expect(page.getByRole('tab', { name: /발송할 주문/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    // 고르면 일괄 처리 막대 (송장을 넣어야 일괄 발송)
    await page
      .getByRole('checkbox', { name: /판매 주문 #\d+ 선택/ })
      .first()
      .check()
    const bulk = page.getByRole('region', { name: '일괄 처리' })
    await expect(bulk.getByRole('button', { name: '1건 일괄 발송' })).toBeDisabled()
    await page
      .getByRole('checkbox', { name: /판매 주문 #\d+ 선택/ })
      .first()
      .uncheck()
    await expect(bulk).toHaveCount(0)
    await page.getByRole('tab', { name: /전체/ }).click()
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
    // 처리 과정 (BE #352, 지금은 목): 단계별 완료 · 직접 확정 표시
    const timeline = page.getByRole('list', { name: '처리 과정' })
    await expect(timeline.getByRole('listitem', { name: '결제 완료 완료' })).toBeVisible()
    await expect(timeline.getByRole('listitem', { name: '배송 완료 완료' })).toBeVisible()
    await expect(timeline.getByRole('listitem', { name: '구매확정 완료' })).toContainText('직접')
  })

  await test.step('취소 · 실패: 재고 부족 → 결제 마감 → 잔액 부족 (기획서 2.1)', async () => {
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
    // 주문상품 단위 이유 (BE 예정 items[].unavailableReason, 가짜 백엔드는 지금 보냄)
    await expect(page.getByText('재고 부족', { exact: true })).toBeVisible()
    // 처리 과정: 결제 요청 해당 없음 → 주문 취소(재고 부족, 시각은 근사)
    const cancelled = page.getByRole('list', { name: '처리 과정' })
    await expect(
      cancelled.getByRole('listitem', { name: '재고 확보 · 결제 요청 해당 없음' }),
    ).toBeVisible()
    await expect(cancelled.getByRole('listitem', { name: '주문 취소' })).toContainText('재고 부족')
    await expect(cancelled.getByRole('listitem', { name: '주문 취소' })).toContainText('약 ')
    // 취소돼도 장바구니는 남아 있다 → 다시 확인하고 뺀다
    await page.getByRole('link', { name: '장바구니에서 다시 확인하기' }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await page.getByRole('button', { name: '빼기' }).first().click()
    await expect(page.getByText('장바구니가 비었어요.')).toBeVisible()
    // 결제 마감 → 자동 취소 (실제 백엔드는 상품 order.created 리스너가 없어 이렇게 끝난다).
    // 가짜 백엔드가 다음 주문을 처리하지 않고 5초 뒤 마감 취소하게 한다
    await page.request.post('http://localhost:18080/__fake/payment-stall', {
      data: { timeoutMs: 5000 },
    })
    await order('2', /그레이 \/ 120/, '1')
    await expect(
      page.getByText(/\d\d:\d\d까지 결제되지 않으면 주문이 자동으로 취소돼요/),
    ).toBeVisible()
    await expect(page.getByText(/결제 마감 시간이 지나 주문이 자동으로 취소됐어요/)).toBeVisible()
    await expect(page.getByText(/결제 마감 \d\d:\d\d · 담았던 상품은 장바구니에/)).toBeVisible()
    await page.getByRole('link', { name: '장바구니에서 다시 확인하기' }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await page.getByRole('button', { name: '빼기' }).first().click()
    await expect(page.getByText('장바구니가 비었어요.')).toBeVisible()
    // 잔액보다 큰 금액 → 결제 실패 취소 · 결제 도메인 실패 기록
    await order('1', /네이비 \/ 110/, '8')
    await expect(page.getByText(/예치금 결제에 실패했어요/)).toBeVisible()
    await expect(page.getByRole('status', { name: '결제 확인' })).toContainText('일치')

    await page.goto('/console/verify')
    const failure = page.getByRole('region', { name: '취소 · 실패 시나리오' })
    await expect(failure.getByText('통과 4')).toBeVisible()
    await expect(failure.getByText('실패 0')).toBeVisible()
    await page.goto('/')
  })

  await test.step('쇼핑: 선택 주문 · 부족한 만큼 충전하고 돌아오기 (기획서 F05 · F06)', async () => {
    // 결제에 실패한 주문의 상품(110 × 8)은 장바구니에 그대로 남아 있다 (BE: 결제 완료 뒤에만 뺀다)
    await page.goto('/cart')
    await expect(page.getByRole('checkbox', { name: /데일리 맨투맨.*110 주문하기/ })).toBeVisible()

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
    // 주문 상태 요약 → 그 탭으로 바로
    const summary = page.getByRole('region', { name: '주문 상태 요약' })
    await summary.getByRole('link', { name: /결제 완료/ }).click()
    await expect(page).toHaveURL(/\/orders\?tab=PAID$/)
    await expect(page.getByRole('tab', { name: /결제 완료/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.getByText(/주문번호/).first()).toBeVisible()
  })

  await test.step('관리자: 회원 관리 · 판매자 자격 정지 · 전체 주문 · 결제 · 정산 실행', async () => {
    await switchRole(page, '관리자')
    await page.goto('/admin')
    // 대시보드: 오늘 숫자 · 처리할 일
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible()
    await expect(page.getByText('오늘 주문', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: '회원 관리' }).click()
    await expect(page.getByRole('heading', { name: '회원 관리' })).toBeVisible()
    await page.getByRole('button', { name: '판매자', exact: true }).nth(1).click()
    await page.getByRole('textbox', { name: '회원 검색' }).fill('테스트')
    await page.getByRole('button', { name: '검색' }).click()
    await page.getByRole('button', { name: '판매자 자격 정지' }).click()
    await page.getByRole('textbox', { name: '판매자 정지 사유' }).fill('정책 위반 상품 반복 등록')
    await page.getByRole('button', { name: '자격 정지하기' }).click()
    await expect(page.getByText('판매자 자격 정지', { exact: true })).toBeVisible()

    // 관리자 지정 · 해제 (BE #356): 관리자는 관리자 탭에서만 보이고, 본인은 해제할 수 없다
    await page.getByRole('textbox', { name: '회원 검색' }).fill('')
    await page.getByRole('button', { name: '검색' }).click()
    await page.getByRole('button', { name: '보호자', exact: true }).nth(1).click()
    const guardian = page.locator('[data-slot="card"]').filter({ hasText: '회원 1' })
    await guardian.getByRole('button', { name: '관리자 지정' }).click()
    await expect(guardian).toHaveCount(0)
    await page.getByRole('button', { name: '관리자', exact: true }).nth(1).click()
    const me = page.locator('[data-slot="card"]').filter({ hasText: '회원 3' })
    await expect(me).toBeVisible()
    await expect(me.getByRole('button', { name: '권한 해제' })).toHaveCount(0)
    await guardian.getByRole('button', { name: '권한 해제' }).click()
    await expect(guardian).toHaveCount(0)

    await page.getByRole('link', { name: '상품 관리' }).click()
    // 목록은 실제 GET /products(BE #288), 관리자 판매 중지는 아직 목 → 버튼 옆 준비 중(목) 배지.
    // 목 판매 중지는 실제 목록에 반영되지 않으므로 오류 없이 요청이 끝나는 것까지만 본다
    // 관리자 판매 중지는 실제 API(BE #315) → 판매 중 목록에서 빠진다. 이 흐름에서 등록한 상품으로 확인
    const onSale = page.locator('[data-slot="card"]').filter({ hasText: '데일리 맨투맨' })
    await expect(onSale.first()).toBeVisible()
    const before = await onSale.count()
    await onSale.first().getByRole('button', { name: '판매 중지' }).click()
    await expect(onSale).toHaveCount(before - 1)

    await page.getByRole('link', { name: '전체 주문' }).click()
    await expect(page.getByText(/^주문 \d+$/).first()).toBeVisible()
    // 공통 표: 행을 누르면 상세 서랍 (결제 연결), CSV 내려받기
    await page.getByRole('table', { name: '전체 주문' }).getByRole('row').nth(1).click()
    const sheet = page.getByRole('dialog', { name: /^주문 \d+$/ })
    await expect(sheet.getByText('이 주문의 결제')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'CSV 내려받기' }).click()
    expect((await download).suggestedFilename()).toBe('kidly-orders-all.csv')
    await page.getByRole('link', { name: '전체 결제' }).click()
    await expect(page.getByText('결제 완료').first()).toBeVisible()

    await page.getByRole('link', { name: '정산', exact: true }).click()
    await page.getByRole('button', { name: '정산 실행' }).click()
    // 앞 E2E가 같은 기준일로 이미 실행했으면 BE처럼 409 문구를 그대로 보여 준다
    await expect(page.getByText(/정산 완료 · 성공 \d+|이미 정산한 기준일입니다/)).toBeVisible()
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
