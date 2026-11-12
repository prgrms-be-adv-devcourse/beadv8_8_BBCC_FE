import { expect, test, type Page } from '@playwright/test'
import { signInAdmin } from './support/admin'
import { acceptConfirms } from './support/confirm'
import { pickOption } from './support/option'

// 사용자 화면(쇼핑 · 판매자 센터 · 관리자)으로 같은 흐름을 따라간다.
// 시연 콘솔 테스트와 가짜 백엔드를 같이 쓰므로, 앞선 테스트가 남긴 데이터가 있어도 통과하게 쓴다.

const NICKNAME = {
  보호자: '보호자 · 회원 1',
  판매자: '테스트상점 · 회원 2',
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

test('판매자 상호명 수정은 새로고침 뒤에도 유지된다', async ({ page }) => {
  await page.goto('/center')
  await switchRole(page, '판매자')
  await page.goto('/center/store')
  await page.getByRole('button', { name: '상호명 수정' }).click()
  const name = `새 상호명 ${Date.now()}`
  await page.getByRole('textbox', { name: '상호명' }).fill(name)
  await page.getByRole('button', { name: '상호명 저장' }).click()
  await expect(page.getByRole('region', { name: '상점' })).toContainText(name)
  await page.reload()
  await expect(page.getByRole('region', { name: '상점' })).toContainText(name)
})

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
    // 사이즈를 고르기 전에는 로그인으로 보내지 않고 사이즈부터 고르게 한다
    await page.getByRole('button', { name: '로그인하고 담기' }).click()
    await expect(page).toHaveURL(/\/products\/1$/)
    await expect(page.getByRole('alert')).toHaveText('사이즈를 골라 주세요.')
    // 고른 옵션은 로그인 뒤 돌아올 주소에 실리고, 돌아오면 고른 사이즈 · 수량이 그대로다
    const sizes = page.getByRole('group', { name: '사이즈', exact: true })
    await sizes.getByRole('button').first().click()
    await expect(page.getByRole('link', { name: '로그인하고 담기' })).toHaveAttribute(
      'href',
      '/login?next=%2Fproducts%2F1%3Foption%3D1',
    )
    await page.goto('/products/1?option=1&qty=2')
    await expect(sizes.getByRole('button').first()).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('spinbutton')).toHaveValue('2')
    await page.goto('/cart')
    await expect(page).toHaveURL(/\/login\?next=%2Fcart$/)
    await expect(page.getByText('로그인하면 보던 화면으로 돌아가요.')).toBeVisible()
    await page.getByRole('main').getByRole('button', { name: '보호자', exact: true }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(page.getByRole('heading', { name: '장바구니' })).toBeVisible()
  })

  await test.step('관리자 영역: 관리자 계정으로 로그인하기 전에는 로그인 폼 (회원 역할과 따로)', async () => {
    await page.goto('/admin')
    await switchRole(page, '보호자')
    await expect(page.getByRole('heading', { name: '관리자 로그인' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '대시보드' })).toHaveCount(0)
  })

  await test.step('판매자 센터: 사진 업로드(목) → 상품 등록 → 판매 시작 (실제 API)', async () => {
    await switchRole(page, '판매자')
    await page.goto('/center/products')
    await expect(page.getByRole('heading', { name: '상품 관리' })).toBeVisible()
    // 단계 번호 · 백엔드 설명은 콘솔에서만 보인다
    await expect(page.getByText('product.changed')).toHaveCount(0)
    // 등록은 따로인 화면: 목록 제목 줄의 「상품 등록」으로 간다
    await page.getByRole('main').getByRole('link', { name: '상품 등록' }).click()
    await expect(page.getByRole('heading', { name: '상품 등록' })).toBeVisible()
    // 긴 변 2400px PNG를 고르면 JPG로 줄여 발급받고(가짜 백엔드), 받은 주소로 S3에 PUT한다
    const uploaded = page.waitForRequest(
      (request) => request.method() === 'PUT' && request.url().includes('X-Amz-Signature='),
    )
    await page.getByLabel(/^대표 사진 \(/).setInputFiles({
      name: 'photo.png',
      mimeType: 'image/png',
      buffer: await pngOf(page, 2400, 1200),
    })
    // 서명에 맞게 줄인 형식을 그대로 보내고, 토큰은 S3로 보내지 않는다
    const put = await uploaded
    expect(put.headers()['content-type']).toBe('image/jpeg')
    expect(put.headers().authorization).toBeUndefined()
    await expect(page.getByRole('img', { name: '대표 사진 1' })).toBeVisible()
    // 대표 칸은 1장만, 상세 칸은 여러 장
    await expect(page.getByLabel(/^대표 사진 \(/)).not.toHaveAttribute('multiple')
    await page.getByLabel(/^상세 사진 \(/).setInputFiles([
      { name: 'detail-1.png', mimeType: 'image/png', buffer: await pngOf(page, 800, 600) },
      { name: 'detail-2.png', mimeType: 'image/png', buffer: await pngOf(page, 800, 600) },
    ])
    await expect(page.getByRole('img', { name: '상세 사진 2' })).toBeVisible()
    // 상품 설명 · SKU 코드(선택)를 넣고, 뺀 옵션은 다시 넣을 수 있다
    await page.getByLabel('상품 설명').fill('  부드러운 면 맨투맨  ')
    const sku = `NV-110-${Date.now()}`
    await page.getByLabel('네이비 / 110 SKU 코드').fill(` ${sku} `)
    await page.getByRole('button', { name: '네이비 / 120 빼기' }).click()
    await expect(page.getByLabel('네이비 / 120 재고')).toHaveCount(0)
    await page.getByRole('button', { name: '뺀 옵션 1개 다시 넣기' }).click()
    await expect(page.getByLabel('네이비 / 120 재고')).toBeVisible()
    // 판매 시작만 한 번 실패시킨다 → 상품은 판매 대기로 남고, 다시 시작할 수 있다
    await page.route(
      '**/api/v1/seller/products/*/sale-status',
      (route) =>
        route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'about:blank',
            title: '판매를 시작할 수 없습니다',
            status: 409,
            detail: '잠시 뒤 다시 시도해 주세요.',
            instance: '/api/v1/seller/products/1/sale-status',
          }),
        }),
      { times: 1 },
    )
    const registering = page.waitForRequest(
      (request) => request.method() === 'POST' && request.url().endsWith('/seller/products'),
    )
    await page.getByRole('button', { name: '등록하고 판매 시작' }).click()
    const body = (await registering).postDataJSON() as {
      description: string | null
      thumbnailUrl: string
      imageUrls: string[]
      options: { skuCode: string | null }[]
    }
    expect(body.description).toBe('부드러운 면 맨투맨')
    expect(body.options.map((option) => option.skuCode)).toEqual([sku, null])
    // 대표는 thumbnailUrl과 imageUrls 맨 앞에 함께 보낸다 (대표 1장 + 상세 2장)
    expect(body.imageUrls).toHaveLength(3)
    expect(body.thumbnailUrl).toBe(body.imageUrls[0])
    expect(body.thumbnailUrl).toMatch(BUCKET_IMAGE)
    // 등록 결과 줄의 판매 시작 (다시 시작하면 화면에 판매 시작 버튼이 남지 않는다)
    const registered = page.getByText(/상품 #\d+를 등록/).locator('..')
    await expect(registered).toContainText('판매 대기로 남았어요. 잠시 뒤 다시 시도해 주세요.')
    await registered.getByRole('button', { name: '판매 시작' }).click()
    await expect(registered.getByText(/등록하고 판매를 시작했어요/)).toBeVisible()
    await expect(page.getByRole('button', { name: '판매 시작', exact: true })).toHaveCount(0)
    // 같은 SKU 코드로 다시 등록하면 서버가 거절하고 그 설명을 그대로 보여 준다
    await page.getByRole('button', { name: '등록하고 판매 시작' }).click()
    await expect(page.getByText(`겹친 코드는 ${sku}입니다.`)).toBeVisible()
  })

  await test.step('판매자 센터: 상품 수정 · 사진 더하기 · 재고 조정 · 판매 중지 → 다시 판매 (실제 API)', async () => {
    // 내 상품은 등록 최신순 → 방금 등록한 상품이 목록 표 맨 위 행. 상품명을 눌러 상세로 간다
    await page.getByRole('main').getByRole('link', { name: '상품 관리' }).click()
    await expect(page.getByRole('heading', { name: '상품 관리' })).toBeVisible()
    // 등록 전 목록이 캐시에 있다가 새로 받아 오므로, 방금 등록한 상품이 맨 위에 올 때까지 기다린다
    const newest = page.getByRole('table', { name: '내 상품' }).getByRole('link').first()
    await expect(newest).toHaveText(/데일리 맨투맨/)
    await newest.click()
    const mine = page.getByRole('main')
    // 수정 폼은 등록과 같은 칸을 지금 값으로 채운다. 판매 중이라 옵션 · 판매가 · 실측은 잠긴다
    await mine.getByRole('button', { name: '수정' }).click()
    await expect(mine.getByText(/판매를 시작한 상품은 옵션/)).toBeVisible()
    await expect(mine.getByLabel('상품명')).toHaveValue(/데일리 맨투맨/)
    await expect(mine.getByLabel('상품 설명')).toHaveValue('부드러운 면 맨투맨')
    await expect(mine.getByRole('img', { name: '대표 사진 1' })).toBeVisible()
    await expect(mine.getByRole('img', { name: '상세 사진 2' })).toBeVisible()
    await mine.getByLabel('상품명').fill('데일리 맨투맨 (수정)')
    // 지금 상세 사진 뒤에 새 사진을 더한다
    await mine.getByLabel(/^상세 사진 \(/).setInputFiles({
      name: 'photo-2.png',
      mimeType: 'image/png',
      buffer: await pngOf(page, 800, 600),
    })
    await expect(mine.getByRole('img', { name: '상세 사진 3' })).toBeVisible()
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
    expect(update.imageUrls).toHaveLength(4)
    expect([update.options, update.prices, update.sizeSpecs]).toEqual([null, null, null])
    await expect(mine.getByRole('button', { name: '수정 저장' })).toHaveCount(0)
    await expect(mine.getByText('데일리 맨투맨 (수정)')).toBeVisible()
    await mine.getByRole('button', { name: '재고 조정' }).first().click()
    await mine.getByLabel('네이비 / 110 증감 수량').fill('5')
    await mine.getByRole('button', { name: '조정', exact: true }).click()
    await expect(mine.getByText('재고 15')).toBeVisible()
    await mine.getByRole('button', { name: '판매 중지' }).click()
    await expect(mine.getByRole('button', { name: '판매 시작' })).toBeVisible()
    await mine.getByRole('button', { name: '판매 시작' }).click()
    await expect(mine.getByRole('button', { name: '판매 중지' })).toBeVisible()
    // 재고 적음 탭 (상품 B 옵션 재고 5): 서버가 판매 중 상품 가운데 재고 적은 옵션이 있는 것만 준다
    await mine.getByRole('link', { name: '상품 관리' }).click()
    await expect(page.getByRole('heading', { name: '상품 관리' })).toBeVisible()
    const lowTab = page.getByRole('tab', { name: /재고 적음/ })
    const lowRequest = page.waitForRequest(
      (request) =>
        request.url().includes('/seller/products?') &&
        new URL(request.url()).searchParams.get('lowStock') === 'true' &&
        new URL(request.url()).searchParams.get('size') === '20',
    )
    await lowTab.click()
    expect(new URL((await lowRequest).url()).searchParams.get('status')).toBe('ON_SALE')
    await expect(lowTab).toHaveAttribute('aria-selected', 'true')
    await expect(page).toHaveURL(/stock=low/)
    const products = page.getByRole('table', { name: '내 상품' })
    await expect(products.getByText('밴딩 조거 팬츠 (상품 B)')).toBeVisible()
    // 꼬리표를 누르면 상품 상세의 옵션별 재고로 간다. 상세 위 「재고 확인」은 판매 중 옵션만 센다
    await products
      .getByRole('row', { name: /밴딩 조거 팬츠/ })
      .getByRole('link', { name: '재고 적음 옵션 1개 보기' })
      .click()
    await expect(page).toHaveURL(/#option-stock$/)
    await expect(page.getByText('품절 0 · 재고 적음 1')).toBeVisible()
  })

  await test.step('마이페이지: 자녀 · 배송지 등록', async () => {
    await switchRole(page, '보호자')
    // 자녀 등록은 목록과 따로인 화면. 등록하면 목록으로 돌아온다
    await page.goto('/my/children/new')
    await page.getByRole('checkbox', { name: /필수 동의/ }).check()
    await page.getByRole('checkbox', { name: /선택 동의/ }).check()
    await page.getByRole('button', { name: '등록하기' }).click()
    await expect(page).toHaveURL(/\/my\/children$/)
    await expect(page.getByText('#').first()).toBeVisible()
    await page.goto('/my/addresses')
    // 입력은 시트에서 한다
    await page.getByRole('button', { name: '+ 새 배송지 추가' }).click()
    await page.getByRole('button', { name: '등록하기' }).click()
    await expect(page.getByText('기본', { exact: true }).first()).toBeVisible()
  })

  await test.step('마이페이지: 자녀 수정 → 성장 이력 삭제 · 배송지 수정', async () => {
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
    await expect(page.getByText(/한 달에 한 번 키를 기록해 주세요/)).toBeVisible()
    await page.removeLocatorHandler(page.getByRole('alertdialog'))
    const growth = page.getByRole('region', { name: '성장 이력' })
    const latest = growth.getByRole('listitem').first()
    await latest.getByRole('button', { name: '삭제' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: '취소' }).click()
    await expect(latest).toContainText('118.0cm')
    await latest.getByRole('button', { name: '삭제' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: '삭제' }).click()
    await expect(growth.getByText('118.0cm')).toHaveCount(0)
    await expect(page.getByRole('img', { name: /지금 115cm/ })).toBeVisible()
    await expect(growth.getByRole('button', { name: '삭제' })).toBeDisabled()
    await expect(growth.getByText('기록이 하나뿐이면 지울 수 없어요.')).toBeVisible()
    await acceptConfirms(page)
    // 삭제로 자녀 현재 키가 115로 돌아갔으니, 뒤 단계가 쓰는 118로 다시 저장한다
    await page.getByLabel('키 (cm)').fill('118')
    await page.getByRole('button', { name: '저장하기' }).click()
    // 앞 저장의 토스트가 아직 떠 있을 수 있어 토스트 대신 저장 결과를 본다
    await expect(page.getByRole('img', { name: /지금 118cm/ })).toBeVisible()

    await page.goto('/my/addresses')
    await page.getByRole('button', { name: '수정' }).first().click()
    await expect(page.getByText('배송지 수정')).toBeVisible()
    await page.getByRole('button', { name: '저장하기' }).click()
    await expect(page.getByText('배송지 수정')).toHaveCount(0)
  })

  await test.step('쇼핑: 상품 검색 · 카테고리 · 정렬 · 옵션 거르기 (GET /products, 가짜 백엔드)', async () => {
    await page.getByRole('link', { name: 'Kidly', exact: true }).click()
    // 홈 위 맞춤 상품과 섞이지 않게 아래 「전체 상품」 안에서 본다
    const list = page.getByRole('region', { name: '전체 상품' })
    await page.getByRole('textbox', { name: '상품 검색' }).fill('조거')
    await page.getByRole('button', { name: '검색' }).click()
    await expect(list.getByText('밴딩 조거 팬츠 (상품 B)')).toBeVisible()
    await expect(list.getByText('데일리 맨투맨 (상품 A)')).toHaveCount(0)
    await page.getByRole('textbox', { name: '상품 검색' }).fill('')
    await page.getByRole('button', { name: '검색' }).click()
    await page.getByRole('button', { name: '상의', exact: true }).click()
    await expect(list.getByText('데일리 맨투맨 (상품 A)')).toBeVisible()
    await expect(list.getByText('밴딩 조거 팬츠 (상품 B)')).toHaveCount(0)
    await page.getByRole('button', { name: '전체 카테고리' }).click()
    await expect(page).not.toHaveURL(/cat=/)

    // 정렬 (BE sort): 낮은 가격순이면 A(25,000원)가 B(30,000원)보다 앞
    await page.getByRole('combobox', { name: '정렬' }).selectOption('PRICE_ASC')
    // 거르기는 주소에 남는다 (상세에서 뒤로 와도 유지)
    await expect(page).toHaveURL(/sort=PRICE_ASC/)
    const names = list.getByText(/\(상품 [AB]\)$/)
    await expect(names.first()).toHaveText('데일리 맨투맨 (상품 A)')
    await page.getByRole('combobox', { name: '정렬' }).selectOption('PRICE_DESC')
    await expect(page).toHaveURL(/sort=PRICE_DESC/)
    await expect(names.first()).toHaveText('밴딩 조거 팬츠 (상품 B)')
    await page.getByRole('combobox', { name: '정렬' }).selectOption('NEWEST')

    // 옵션 값 거르기 (BE attributes): 바지 + 색상 그레이 → B만, 네이비로 바꾸면 없음
    await page.getByRole('button', { name: '바지', exact: true }).click()
    const color = page.getByRole('group', { name: '색상 거르기' })
    await color.getByRole('button', { name: '그레이' }).click()
    await expect(list.getByText('밴딩 조거 팬츠 (상품 B)')).toBeVisible()
    await color.getByRole('button', { name: '그레이' }).click()
    await color.getByRole('button', { name: '네이비' }).click()
    await expect(list.getByText('조건에 맞는 상품이 없어요.')).toBeVisible()
    await page.getByRole('button', { name: '거르기 지우기' }).click()
    await page.getByRole('button', { name: '전체 카테고리' }).click()
  })

  await test.step('쇼핑: 자녀 맞춤 상품 → 상세 추천 → 담기', async () => {
    await page.getByRole('link', { name: 'Kidly', exact: true }).click()
    // 홈 위 맞춤 영역: 자녀에게 맞는 사이즈가 있는 상품 (GET /recommendations/products?childId=)
    const recommended = page.getByRole('region', { name: '맞춤 상품' })
    const testKid = recommended.getByRole('button', { name: /^테스트 \(/ })
    if ((await testKid.count()) > 0) await testKid.first().click()
    await expect(recommended.getByRole('heading', { name: /테스트에게 맞는 옷/ })).toBeVisible()
    // 상세에 들어가면 고른 자녀로 상세 진입을 한 번 기록한다 (추천이 회원 활동으로 셈)
    const viewed = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && request.url().endsWith('/recommendations/product-views'),
    )
    await recommended.getByText('데일리 맨투맨 (상품 A)').first().click()
    await expect(page).toHaveURL(/\/products\/\d+\?childId=/)
    const childId = new URL(page.url()).searchParams.get('childId')
    expect((await viewed).postDataJSON()).toEqual({
      productId: expect.any(String),
      childId,
    })
    await expect(page.getByText('추천 사이즈')).toBeVisible()
    // 착용 미리보기는 사이즈 칩 위 추천 한 줄의 「사이즈 자세히」를 펼치면 보인다.
    // 추천 사이즈로 시작, 사이즈를 바꾸면 그림 · 문구가 바뀐다. 문구는 서버의 밑단 · 소매 위치로 정한다
    await page.getByRole('button', { name: '사이즈 자세히' }).click()
    await expect(
      page.getByRole('img', {
        name: /키 118cm에 120 사이즈: 허벅지까지 내려와요, 소매는 손목까지 와요/,
      }),
    ).toBeVisible()
    await page
      .getByRole('group', { name: '미리볼 사이즈' })
      .getByRole('button', { name: '110' })
      .click()
    await expect(page.getByRole('img', { name: /키 118cm에 110 사이즈/ })).toBeVisible()
    // 사이즈를 고르기 전에는 담을 수 없고, 무엇을 고를지 알려 준다
    await expect(page.getByRole('button', { name: '장바구니 담기' })).toBeDisabled()
    await pickOption(page, '네이비', '120')
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
    // 상호명 수정은 상점 정보 화면에서 (홈 머리 줄은 읽기만)
    await page.getByRole('main').getByRole('link', { name: '상점 정보' }).click()
    await page.getByRole('button', { name: '상호명 수정' }).click()
    await page.getByRole('textbox', { name: '상호명' }).fill('테스트상점 본점')
    await page.getByRole('button', { name: '상호명 저장' }).click()
    await expect(page.getByText('테스트상점 본점')).toBeVisible()
    await page
      .getByRole('navigation', { name: '판매자 센터 메뉴' })
      .getByRole('link', { name: '홈', exact: true })
      .click()
    // 오늘 할 일 → 그 탭으로 바로
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
    // 이번 주문의 판매 주문을 연다
    await page
      .getByRole('row')
      .filter({ hasText: '발송 준비' })
      .filter({ has: page.getByText(`주문번호 ${orderUrl.split('/').at(-1)}`, { exact: true }) })
      .getByRole('link', { name: /판매 주문 #\d+/ })
      .click()
    await expect(page).toHaveURL(/\/center\/orders\/\d+$/)
    await page.getByRole('button', { name: '발송', exact: true }).first().click()
    // 서버에는 택배사 코드(CJ)를 보내고, 화면에는 이름으로 보인다
    await expect(page.getByText(/CJ대한통운 \S+/).first()).toBeVisible()
    await page.getByRole('button', { name: '배송 완료 처리' }).first().click()
    await expect(page.getByText('배송 완료', { exact: true }).first()).toBeVisible()
  })

  await test.step('쇼핑: 구매확정 → 진행 막대 끝까지', async () => {
    await switchRole(page, '보호자')
    await page.goto(orderUrl)
    await expect(page.locator('[aria-current="step"]')).toHaveText('4')
    await page.getByRole('button', { name: '구매확정' }).click()
    await expect(page.locator('[aria-current="step"]')).toHaveText('5')
    // 처리 과정 (BE #352 GET /orders/{id}/timeline): 단계별 완료 · 직접 확정 표시
    const timeline = page.getByRole('list', { name: '처리 과정' })
    await expect(timeline.getByRole('listitem', { name: '결제 완료 완료' })).toBeVisible()
    await expect(timeline.getByRole('listitem', { name: '배송 완료 완료' })).toBeVisible()
    await expect(timeline.getByRole('listitem', { name: '구매확정 완료' })).toContainText('직접')
  })

  await test.step('쇼핑: 리뷰 쓰기 → 상품 상세 · 내 리뷰 (기획서 ⑧, 실제 API)', async () => {
    // 구매확정한 주문상품 줄에 「리뷰 쓰기」 (GET /reviews/eligible)
    await page.getByRole('link', { name: '리뷰 쓰기' }).click()
    await expect(page.getByRole('heading', { name: '리뷰 쓰기' })).toBeVisible()
    // 빈 채로 보내면 화면에서 막는다
    const submit = page.getByRole('button', { name: '리뷰 남기기' })
    await submit.click()
    await expect(page.getByText('별점을 골라 주세요.')).toBeVisible()
    await expect(page.getByText('내용을 적어 주세요.')).toBeVisible()
    await page.getByRole('radio', { name: '4점' }).click()
    await page.getByRole('radio', { name: '잘 맞아요' }).click()
    await page.getByLabel('내용').fill('  두 번 빨아도 늘어나지 않아요  ')
    // 사진은 발급받은 주소로 S3에 PUT (가로챔)
    const uploaded = page.waitForRequest(
      (request) => request.method() === 'PUT' && request.url().includes('/reviews/'),
    )
    await page.getByLabel(/^사진 \(선택/).setInputFiles({
      name: 'review.png',
      mimeType: 'image/png',
      buffer: await pngOf(page, 800, 600),
    })
    expect((await uploaded).headers()['content-type']).toBe('image/jpeg')
    await expect(page.getByRole('img', { name: '올린 사진 1' })).toBeVisible()
    // 두 번 눌러도 한 번만 보낸다
    const posts: string[] = []
    page.on('request', (request) => {
      if (request.method() === 'POST' && /\/api\/v1\/reviews$/.test(request.url()))
        posts.push(request.url())
    })
    await submit.dblclick()
    const written = page.getByRole('region', { name: '남긴 리뷰' })
    await expect(written.getByText('두 번 빨아도 늘어나지 않아요')).toBeVisible()
    await expect(written.getByText('사이즈 핏 잘 맞아요')).toBeVisible()
    expect(posts).toHaveLength(1)

    // 상품 상세: 요약(평균 · 수 · 핏 분포)과 목록에 보인다
    await page.getByRole('link', { name: '상품 상세에서 보기' }).click()
    const reviews = page.getByRole('region', { name: '리뷰', exact: true })
    await expect(reviews.getByText('두 번 빨아도 늘어나지 않아요').first()).toBeVisible()
    const summary = reviews.getByRole('region', { name: '리뷰 요약' })
    await expect(summary.getByText(/리뷰 \d+개/)).toBeVisible()
    await expect(summary.getByRole('listitem', { name: /^잘 맞아요 \d+%$/ })).toBeVisible()

    // 내 리뷰: 고치기 → 저장하면 목록에 바뀐 내용
    await page.goto('/my/reviews')
    const mine = page.getByRole('region', { name: '내가 쓴 리뷰' })
    const card = mine.getByRole('listitem').filter({ hasText: '두 번 빨아도 늘어나지 않아요' })
    await card.getByRole('button', { name: '고치기' }).click()
    await page.getByLabel('내용').fill('두 번 빨아도 그대로예요')
    await page.getByRole('button', { name: '고친 내용 저장' }).click()
    await expect(mine.getByText('두 번 빨아도 그대로예요')).toBeVisible()

    // 주문 상세: 이제 「리뷰 작성 완료」
    await page.goto(orderUrl)
    await expect(page.getByRole('link', { name: '리뷰 작성 완료' })).toBeVisible()
  })

  await test.step('취소 · 실패: 재고 부족 → 결제 마감 → 잔액 부족 (기획서 2.1)', async () => {
    const order = async (productId: string, option: [string, string], quantity: string) => {
      await page.goto(`/products/${productId}`)
      await pickOption(page, ...option)
      await page.getByRole('spinbutton').fill(quantity)
      await page.getByRole('button', { name: '장바구니 담기' }).click()
      await page.getByRole('link', { name: '장바구니 보기' }).click()
      await page.getByRole('button', { name: /주문하기/ }).click()
      await expect(page).toHaveURL(/\/orders\/\d+$/)
    }
    // 상품 B 재고 5개보다 많이 → 재고 부족 취소
    await order('2', ['그레이', '120'], '6')
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
    await order('2', ['그레이', '120'], '1')
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
    await order('1', ['네이비', '110'], '8')
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
    await page.goto(
      `/my/wallet/charge/success?paymentKey=pk&orderId=toss-88-${Date.now()}&amount=1000`,
    )
    await page.getByRole('link', { name: '주문서로 돌아가기' }).click()
    await expect(page).toHaveURL(/\/cart$/)

    // 다음 단계에 남지 않게 장바구니를 비운다
    await page.getByRole('button', { name: '빼기' }).click()
    await expect(page.getByText('장바구니가 비었어요.')).toBeVisible()

    // 토스 결제창이 실패 · 취소로 돌아오면 그 충전을 서버에 실패로 알려 바로 끝낸다
    await page.goto(
      '/my/wallet/charge/fail?code=PAY_PROCESS_CANCELED&message=결제를 취소했어요&orderId=toss-89',
    )
    await expect(page.getByText('결제를 취소했어요')).toBeVisible()
    await expect(page.getByText(/이 충전은 결제되지 않았어요/)).toBeVisible()
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
    await signInAdmin(page)
    // 대시보드: 오늘 숫자 · 처리할 일
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible()
    await expect(page.getByText('오늘 주문', { exact: true })).toBeVisible()
    // 결제 숫자는 결제 요약 API(결제일 기준): 앞 단계에서 결제한 금액이 들어간다
    await expect(page.getByRole('link', { name: /오늘 결제된 금액/ })).toContainText(
      /[1-9][\d,]*원/,
    )
    await expect(page.getByRole('link', { name: /환불 있는 결제/ })).toContainText(/\d/)
    await page.getByRole('link', { name: '회원 관리' }).click()
    await expect(page.getByRole('heading', { name: '회원 관리' })).toBeVisible()
    // 목록은 찾기만, 정지는 회원 상세에서 (닉네임 링크는 표 안에서 찾는다: 탭 · 메뉴에 같은 이름이 있다)
    const memberTable = page.getByRole('table', { name: '회원' })
    await page.getByRole('tab', { name: '판매자', exact: true }).click()
    await page.getByRole('textbox', { name: '회원 검색' }).fill('테스트')
    await page.getByRole('button', { name: '검색' }).click()
    await memberTable.getByRole('link', { name: '테스트상점' }).click()
    await expect(page.getByRole('heading', { name: '회원 #2' })).toBeVisible()
    await page.getByRole('button', { name: '판매자 자격 정지' }).click()
    await page.getByRole('textbox', { name: '판매자 정지 사유' }).fill('정책 위반 상품 반복 등록')
    await page.getByRole('button', { name: '자격 정지하기' }).click()
    const memberStatus = page.getByRole('region', { name: '상태' })
    await expect(memberStatus.getByText('자격 정지', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '판매자 자격 정지' })).toHaveCount(0)

    await page.getByRole('link', { name: '상품 관리' }).click()
    // 관리자 판매 중지는 실제 API(BE #315) → 판매 중 목록에서 빠진다. 이 흐름에서 등록한 상품으로 확인
    const onSale = page
      .getByRole('table', { name: '판매 중 상품' })
      .getByRole('row')
      .filter({ hasText: '데일리 맨투맨' })
    await expect(onSale.first()).toBeVisible()
    const before = await onSale.count()
    await onSale.first().getByRole('button', { name: '판매 중지' }).click()
    await expect(onSale).toHaveCount(before - 1)

    await page.getByRole('link', { name: '전체 주문' }).click()
    await expect(page.getByText(/^주문 \d+$/).first()).toBeVisible()
    // 목록 → 상세 화면 (결제 연결), 뒤로 와서 CSV 내려받기
    await page
      .getByRole('table', { name: '전체 주문' })
      .getByRole('link', { name: /^주문 \d+$/ })
      .first()
      .click()
    await expect(page.getByRole('heading', { level: 1, name: /^주문 \d+$/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /^이 주문의 결제/ })).toBeVisible()
    await page.getByRole('main').getByRole('link', { name: '전체 주문' }).click()
    await expect(page).toHaveURL(/\/admin\/orders$/)
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

  await test.step('내 정보: 닉네임 수정 → 토큰 다시 받기 → 탈퇴 → 로그아웃', async () => {
    await page.goto('/my/profile')
    await page.getByRole('button', { name: '변경', exact: true }).click()
    await page.getByLabel(/닉네임/).fill('보호자맘')
    await page.getByRole('button', { name: '닉네임 바꾸기' }).click()
    await expect(page.getByText('보호자맘 · 회원 1').first()).toBeVisible()
    // 목이 아니라 서버로 탈퇴하고, 이어서 로그아웃으로 Refresh Token 쿠키를 지운다 (BE MemberController)
    const withdrawn = page.waitForResponse(
      (response) =>
        response.request().method() === 'DELETE' && response.url().endsWith('/api/v1/members/me'),
    )
    const loggedOut = page.waitForRequest(
      (request) => request.method() === 'POST' && request.url().endsWith('/api/v1/auth/logout'),
    )
    await page.getByRole('button', { name: '탈퇴하기' }).click()
    // 확인 창은 locator 동작 · 단언 때 눌리므로(acceptConfirms) 화면 단언을 먼저 기다린다
    await expect(page.getByText('로그인 전')).toBeVisible()
    expect((await withdrawn).status()).toBe(204)
    await loggedOut
    // 탭에 기억한 시연 계정도 지웠으므로 새로고침해도 탈퇴한 회원으로 다시 로그인하지 않는다
    await page.reload()
    await expect(page.getByText('로그인 전')).toBeVisible()
  })

  expect(pageErrors).toEqual([])
  expect(warnings).toEqual([])
})
