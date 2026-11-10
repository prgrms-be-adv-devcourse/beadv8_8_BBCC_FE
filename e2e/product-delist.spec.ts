import { expect, test } from '@playwright/test'
import { signInAdmin } from './support/admin'
import { acceptConfirms } from './support/confirm'

// 판매자 등록 취소: 확인 창 → 상태가 「등록 취소」로 바뀌고, 판매 상태 · 수정 · 재고 조정 버튼이 사라진다.
// 관리자는 상품 번호로 판매 중지로 되돌린다 (관리자 상품 목록 API가 없어 번호로 부른다).
// 다른 테스트가 쓰는 상품을 건드리지 않게 이 테스트에서 상품 하나를 API로 등록해 판매를 시작한다
const API = 'http://localhost:18080/api/v1'

test('판매자 등록 취소 → 관리자가 상품 번호로 판매 중지로 되돌린다', async ({ page, request }) => {
  const token = await request
    .post(`${API}/dev/tokens`, { data: { memberId: 2, roles: ['BUYER', 'SELLER'] } })
    .then((res) => res.json())
  const auth = { authorization: `Bearer ${token.accessToken}` }
  // 상의(11) · 네이비(101) / 110(202) 옵션 하나, 110 실측 · 권장 키
  const registered = await request
    .post(`${API}/seller/products`, {
      headers: auth,
      data: {
        categoryId: 11,
        name: `등록 취소 확인 ${Date.now()}`,
        brand: null,
        description: null,
        thumbnailUrl: null,
        imageUrls: [],
        attributes: [],
        options: [{ valueIds: [101, 202], initialQuantity: 5, skuCode: null }],
        prices: [{ valueIds: [101, 202], price: 15000 }],
        sizeSpecs: [{ sizeValueId: 202, minHeightCm: 105, maxHeightCm: 115, measurements: {} }],
      },
    })
    .then((res) => res.json())
  const productId = registered.productId as string
  await request.put(`${API}/seller/products/${productId}/sale-status`, {
    headers: auth,
    data: { status: 'ON_SALE' },
  })

  await acceptConfirms(page)
  await page.goto('/')
  await page.getByRole('button', { name: '판매자', exact: true }).first().click()
  await expect(page.getByText('테스트상점 · 회원 2')).toBeVisible()
  await page.goto(`/center/products/${productId}`)
  const actions = page.getByRole('main')
  await expect(actions.locator('dd').getByText('판매 중', { exact: true })).toBeVisible()
  await expect(actions.getByRole('button', { name: '재고 조정' })).toBeVisible()

  await actions.getByRole('button', { name: '등록 취소' }).click()
  // 확인 창은 acceptConfirms가 누른다 (다음 검사 때)
  await expect(actions.locator('dd').getByText('등록 취소', { exact: true })).toBeVisible()
  for (const name of ['판매 중지', '판매 시작', '수정', '등록 취소', '재고 조정'])
    await expect(actions.getByRole('button', { name, exact: true })).toHaveCount(0)

  // 관리자: 번호로 되돌리면 판매 중지, 같은 번호를 다시 되돌리면 서버 설명(409)을 그대로 보여 준다
  await signInAdmin(page)
  await page.goto('/admin/products')
  const revert = page.getByRole('region', { name: '등록 취소 되돌리기' })
  await revert.getByLabel('되돌릴 상품 번호').fill(`#${productId}`)
  await revert.getByRole('button', { name: '등록 취소 되돌리기' }).click()
  await expect(
    revert.getByText(`상품 #${productId} 등록 취소를 되돌렸어요. 이제 판매 중지예요.`),
  ).toBeVisible()
  const detail = await request
    .get(`${API}/seller/products/${productId}`, { headers: auth })
    .then((res) => res.json())
  expect(detail.status).toBe('STOPPED')

  await revert.getByLabel('되돌릴 상품 번호').fill(productId)
  await revert.getByRole('button', { name: '등록 취소 되돌리기' }).click()
  await expect(revert.getByText('등록 취소한 상품만 되돌릴 수 있습니다.')).toBeVisible()
})
