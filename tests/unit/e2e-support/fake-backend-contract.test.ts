import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { toAddressRequest } from '@/entities/address'
import {
  attributeShape,
  attributeValueShape,
  categoryShape,
  measurementItemShape,
  productTypeShape,
} from '@/entities/catalog/api/catalog.shape'
import {
  toAttributeCreateRequest,
  toCatalogCategory,
  toCategoryChangeForm,
  toCategoryChangeRequest,
  toCategoryCreateRequest,
  type CatalogCategory,
  toAttributeValueRequest,
  toMeasurementItemRequest,
  toProductType,
  toProductTypeChangeRequest,
  toProductTypeCreateRequest,
  toProductTypeForm,
} from '@/entities/catalog'
import { addressShape } from '@/entities/address/api/address.shape'
import { toAddCartItemRequest } from '@/entities/cart'
import { cartShape } from '@/entities/cart/api/cart.shape'
import { toChildRequest } from '@/entities/child'
import { childAccountShape } from '@/entities/child-account/api/child-account.shape'
import { childOnboardingShape } from '@/entities/child-onboarding'
import { guardianVerificationShape } from '@/entities/guardian-verification/api/guardian-verification.shape'
import { childShape, growthRecordShape } from '@/entities/child/api/child.shape'
import { deadLetterPageShape, deadLetterShape } from '@/entities/dead-letter/api/dead-letter.shape'
import { adminMemberPageShape } from '@/entities/member/api/member.shape'
import { orderDetailShape, orderPageShape } from '@/entities/order/api/order.shape'
import {
  wishRequestShape,
  wishRequestsShape,
  wishTimelineShape,
} from '@/entities/wish/api/wish.shape'
import { paymentDetailShape, paymentPageShape } from '@/entities/payment/api/payment.shape'
import { deliveryShape, sellerOrderPageShape } from '@/entities/seller-order/api/seller-order.shape'
import { toSellerApplicationRequest } from '@/entities/seller'
import {
  sellerApplicationPageShape,
  sellerApplicationShape,
  sellerShape,
} from '@/entities/seller/api/seller.shape'
import { purchasedGarmentPageShape } from '@/entities/recommendation/api/purchased-garment.shape'
import {
  companionProductsShape,
  homePreviewShape,
  recommendedProductPageShape,
  sizeRecommendationShape,
} from '@/entities/recommendation/api/recommendation.shape'
import { memberShape, tokenShape } from '@/entities/session/api/session.shape'
import {
  chargeCancelShape,
  chargeConfirmShape,
  chargePageShape,
  chargeShape,
  walletLedgerPageShape,
  walletShape,
} from '@/entities/wallet/api/wallet.shape'
import {
  categoryInputsShape,
  categoryTreeShape,
  productDetailShape,
  productListPageShape,
  registerProductResultShape,
  saleStatusResultShape,
  sellerProductDetailShape,
} from '@/entities/product/api/product.shape'
import {
  toCategoryInputs,
  toEditableProductForm,
  toProductSearchParams,
  toProductUpdateRequest,
  toRegisterProductRequest,
  type CategoryInputs,
} from '@/entities/product'
import { toSellerProductDetail } from '@/entities/product/model/product.mapper'
import { DEMO_ADDRESS } from '@/features/manage-address/config/demo-address'
import { demoRegisterForm } from '@/features/register-product/config/demo-product'
import { DEMO_APPLICATION } from '@/features/apply-seller/config/demo-application'
import { DEMO_CHILD } from '@/features/register-child/config/demo-child'
import { toReferenceGarmentRequest } from '@/entities/recommendation'
import {
  referenceGarmentListShape,
  referenceGarmentShape,
} from '@/entities/recommendation/api/reference-garment.shape'
import { toProductViewRequest } from '@/features/record-product-view'
import { toSearchClickRequest } from '@/features/record-search-click'
import { productImageUploadUrlsShape } from '@/features/upload-product-image'
import {
  reviewableItemsShape,
  reviewListShape,
  reviewShape,
  reviewSummaryShape,
} from '@/entities/review/api/review.shape'
import { toUpdateReviewRequest } from '@/features/edit-review'
import { reviewImageUploadShape, toReviewUploadRequest } from '@/features/upload-review-image'
import { toWriteReviewRequest } from '@/features/write-review'
import { toReview } from '@/entities/review'
import { arr, validate, type Shape } from '@/shared/api'

// E2E가 쓰는 가짜 백엔드의 응답이 FE 계약(응답 모양)과 같은지 확인한다.
// 어긋나면 E2E가 아니라 여기서 먼저, 어느 필드인지까지 드러난다.

const PORT = 18093
const BASE = `http://127.0.0.1:${PORT}/api/v1`
let server: ChildProcess
const tokens: Record<number, string> = {}
const ADMIN_LOGIN = { email: 'admin@kidly.local', password: 'local-admin-password' }

async function call(method: string, url: string, as: number | null, body?: unknown) {
  const response = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(as !== null && { authorization: `Bearer ${tokens[as]}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  return { status: response.status, data: text ? JSON.parse(text) : null }
}

/** 계약에 없는 필드(extra)는 깨지지 않으므로 빼고 본다 */
function expectContract(data: unknown, shape: Shape) {
  expect(validate(data, shape).filter((issue) => issue.type !== 'extra')).toEqual([])
}

beforeAll(async () => {
  server = spawn(process.execPath, [path.resolve('e2e/fake-backend/server.mjs')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  await new Promise<void>((resolve) => server.stdout!.once('data', () => resolve()))
  for (const [memberId, roles] of [
    [1, ['BUYER']],
    [2, ['BUYER', 'SELLER']],
  ] as const) {
    const token = await call('POST', '/dev/tokens', null, { memberId, roles })
    expectContract(token.data, tokenShape)
    tokens[memberId] = token.data.accessToken
  }
  // 3 = 관리자 계정 토큰 (BE #736, 관리자 API는 관리자 토큰만)
  const admin = await call('POST', '/auth/admin/login', null, ADMIN_LOGIN)
  expectContract(admin.data, tokenShape)
  tokens[3] = admin.data.accessToken
})

afterAll(() => {
  server?.kill()
})

describe('가짜 백엔드 응답 = FE 계약', () => {
  it('자녀 계정 계약과 권한', async () => {
    const child = await call('POST', '/children', 1, {
      ...toChildRequest(DEMO_CHILD),
      requiredConsent: true,
      optionalConsent: true,
    })
    const account = await call('POST', '/auth/child-accounts', 1, {
      childProfileId: child.data.id,
      loginId: 'contractchild',
      password: 'password1',
    })
    expect(account.status).toBe(201)
    expectContract(account.data, childAccountShape)
    expectContract((await call('GET', '/auth/child-accounts', 1)).data, arr(childAccountShape))
    const login = await call('POST', '/auth/child/login', null, {
      loginId: 'contractchild',
      password: 'password1',
    })
    expectContract(login.data, tokenShape)
    tokens[4] = login.data.accessToken
    const onboarding = await call('GET', '/child/onboarding', 4)
    expect(onboarding.data).toEqual({ noticeConfirmed: false })
    expectContract(onboarding.data, childOnboardingShape)
    expect((await call('POST', '/child/onboarding/notice', 4)).status).toBe(204)
    expect((await call('POST', '/child/onboarding/notice', 4)).status).toBe(204)
    expect((await call('GET', '/child/onboarding', 4)).data).toEqual({ noticeConfirmed: true })
    const orphan = await call('POST', '/children', 1, {
      ...toChildRequest(DEMO_CHILD),
      requiredConsent: true,
      optionalConsent: true,
    })
    await call('POST', '/auth/child-accounts', 1, {
      childProfileId: orphan.data.id,
      loginId: 'orphanchild',
      password: 'password1',
    })
    const orphanLogin = await call('POST', '/auth/child/login', null, {
      loginId: 'orphanchild',
      password: 'password1',
    })
    tokens[5] = orphanLogin.data.accessToken
    expect((await call('DELETE', `/children/${orphan.data.id}`, 1)).status).toBe(204)
    expect((await call('GET', '/child/onboarding', 5)).status).toBe(404)
    expect((await call('POST', '/child/onboarding/notice', 5)).status).toBe(404)
    expectContract((await call('GET', '/child/profile', 4)).data, childShape)
    // 자녀 장바구니 = /cart (자녀 토큰, BE #998). 입을 아이는 자기로 고정
    const added = await call('POST', '/cart/items', 4, { optionId: 1, childId: null, quantity: 1 })
    expect(added.status).toBe(201)
    expect(added.data.childId).toBe(String(child.data.id))
    const merged = await call('POST', '/cart/items', 4, { optionId: 1, childId: null, quantity: 2 })
    expect(merged.status).toBe(200)
    expect(merged.data.quantity).toBe(3)
    expectContract((await call('GET', '/cart', 4)).data, cartShape)
    expect((await call('GET', '/cart', 1)).data.items).not.toContainEqual(merged.data)
    expect(
      (await call('POST', '/cart/items', 4, { optionId: 1, childId: 999, quantity: 1 })).status,
    ).toBe(400)
    const denied = await call('DELETE', `/cart/items/${added.data.cartItemId}`, 1)
    expect(denied.data).toMatchObject({ status: 403, title: '다른 사람의 장바구니입니다' })
    expect((await call('DELETE', `/cart/items/${added.data.cartItemId}`, 4)).status).toBe(204)
    // 조르기 보내기 = POST /wish/requests (자녀만, BE #999)
    const pending = await call('POST', '/cart/items', 4, {
      optionId: 1,
      childId: null,
      quantity: 1,
    })
    const childRequest = await call('POST', '/wish/requests', 4, {
      cartItemIds: [Number(pending.data.cartItemId)],
      message: '부탁해요',
    })
    expect(childRequest.status).toBe(201)
    expectContract(childRequest.data, wishRequestShape)
    expect(childRequest.data).toMatchObject({
      requestedByType: 'CHILD',
      status: 'REQUESTED',
      childId: String(child.data.id),
    })
    expectContract((await call('GET', '/wish/requests', 4)).data, wishRequestsShape)
    expect((await call('GET', `/wish/requests?childId=${child.data.id}`, 1)).data).toContainEqual(
      childRequest.data,
    )
    expect(
      (await call('POST', '/wish/requests', 1, { cartItemIds: [1], message: null })).status,
    ).toBe(403)
    expect(
      (await call('POST', '/wish/requests', 4, { cartItemIds: [], message: null })).status,
    ).toBe(400)
    expect(
      (await call('POST', '/wish/requests', 4, { cartItemIds: [1, 1], message: null })).status,
    ).toBe(400)
    expect(
      (
        await call('POST', '/wish/requests', 4, {
          cartItemIds: [Number(pending.data.cartItemId)],
          message: 'a'.repeat(101),
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await call('POST', '/wish/requests', 4, {
          cartItemIds: [Number(pending.data.cartItemId)],
          message: null,
        })
      ).status,
    ).toBe(409)
    const reserved = (await call('GET', '/cart', 4)).data.items.find(
      (line: { cartItemId: string }) => line.cartItemId === pending.data.cartItemId,
    )
    expect(reserved.reserved).toBe(true)
    const locked = await call('DELETE', `/cart/items/${pending.data.cartItemId}`, 4)
    expect(locked.data).toMatchObject({ status: 409, title: '예약된 장바구니 상품입니다' })
    expect((await call('GET', '/child/profile', 1)).status).toBe(403)
    expect((await call('GET', '/members/me', 4)).status).toBe(401)
    expect(
      (
        await call('PATCH', `/auth/child-accounts/${account.data.id}/password`, 1, {
          password: 'password2',
        })
      ).status,
    ).toBe(204)
    expect((await call('GET', '/child/profile', 4)).status).toBe(401)
    expect((await call('DELETE', `/auth/child-accounts/${account.data.id}`, 1)).status).toBe(204)
  })
  it('자녀 · 배송지 · 예치금', async () => {
    expectContract(
      (
        await call('POST', '/children', 1, {
          ...toChildRequest(DEMO_CHILD),
          requiredConsent: true,
          optionalConsent: true,
        })
      ).data,
      childShape,
    )
    expectContract((await call('GET', '/children', 1)).data, arr(childShape))
    expectContract(
      (await call('POST', '/members/me/addresses', 1, toAddressRequest(DEMO_ADDRESS))).data,
      addressShape,
    )
    expectContract((await call('GET', '/members/me/addresses', 1)).data, arr(addressShape))
    expectContract((await call('GET', '/wallets/me', 1)).data, walletShape)

    // 회원 · 자녀 보완: 수정 · 성장 이력 · 삭제, 배송지 수정, 내 정보 수정
    const child = (await call('GET', '/children', 1)).data[0]
    const updated = await call('PATCH', `/children/${child.id}`, 1, {
      ...toChildRequest(DEMO_CHILD),
      heightCm: 118,
    })
    expectContract(updated.data, childShape)
    const growth = await call('GET', `/children/${child.id}/growth-records`, 1)
    expectContract(growth.data, arr(growthRecordShape))
    expect(growth.data).toHaveLength(2)
    const address = (await call('GET', '/members/me/addresses', 1)).data[0]
    expectContract(
      (
        await call(
          'PATCH',
          `/members/me/addresses/${address.id}`,
          1,
          toAddressRequest(DEMO_ADDRESS),
        )
      ).data,
      addressShape,
    )
    expectContract(
      (await call('PATCH', '/members/me', 1, { nickname: '새닉네임' })).data,
      memberShape,
    )
    const extra = await call('POST', '/children', 1, {
      ...toChildRequest(DEMO_CHILD),
      requiredConsent: true,
      optionalConsent: true,
    })
    expect((await call('DELETE', `/children/${extra.data.id}`, 1)).status).toBe(204)
    expect((await call('GET', `/children/${extra.data.id}`, 1)).status).toBe(404)
  })
  it('자녀 등록과 수정에서 동의와 나이를 검사한다', async () => {
    const form = toChildRequest(DEMO_CHILD)
    expect((await call('POST', '/children', 1, form)).status).toBe(400)
    expect(
      (
        await call('POST', '/children', 1, {
          ...form,
          requiredConsent: false,
          optionalConsent: true,
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await call('POST', '/children', 1, {
          ...form,
          requiredConsent: true,
          optionalConsent: false,
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await call('POST', '/children', 1, {
          ...form,
          birthDate: '2000-01-01',
          requiredConsent: true,
          optionalConsent: true,
        })
      ).status,
    ).toBe(400)
    const child = await call('POST', '/children', 1, {
      ...form,
      bodyType: null,
      preferredFit: null,
      requiredConsent: true,
      optionalConsent: false,
    })
    expect(child.status).toBe(201)
    expect(child.data.hasOptionalConsent).toBe(false)
    expect((await call('PATCH', `/children/${child.data.id}`, 1, form)).status).toBe(400)
  })

  it('판매자 신청 · 승인', async () => {
    const mine = await call(
      'POST',
      '/members/me/seller-application',
      2,
      toSellerApplicationRequest(DEMO_APPLICATION),
    )
    expectContract(mine.data, sellerApplicationShape)
    expectContract(
      (await call('GET', '/members/me/seller-application', 2)).data,
      sellerApplicationShape,
    )
    expectContract(
      (await call('GET', '/admin/seller-applications', 3)).data,
      sellerApplicationPageShape,
    )
    const rejected = await call('POST', `/admin/seller-applications/${mine.data.id}/reject`, 3, {
      reason: '서류 미비',
    })
    expect(rejected.status).toBe(200)
    // 거절 응답은 심사 목록 한 줄과 같은 모양
    expectContract(
      {
        content: [rejected.data],
        page: 0,
        size: 1,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
      },
      sellerApplicationPageShape,
    )
    const latest = await call('GET', '/members/me/seller-application', 2)
    expect(latest.data).toMatchObject({ status: 'REJECTED', rejectReason: '서류 미비' })
    const pending = await call('GET', '/admin/seller-applications?status=PENDING&page=0&size=1', 3)
    expect(pending.data).toMatchObject({ content: [], totalElements: 0 })
    const rejectedPage = await call(
      'GET',
      '/admin/seller-applications?status=REJECTED&page=0&size=1',
      3,
    )
    expect(rejectedPage.data).toMatchObject({
      content: [{ id: mine.data.id, status: 'REJECTED' }],
      totalElements: 1,
      size: 1,
    })
    expectContract((await call('GET', '/seller/me', 2)).data, sellerShape)
  })

  it('장바구니 → 주문 → 결제 완료 → 발송 · 배송 완료 → 구매확정', async () => {
    await call(
      'POST',
      '/cart/items',
      1,
      toAddCartItemRequest({ optionId: '2', childId: null, quantity: 1 }),
    )
    const cart = await call('GET', '/cart', 1)
    expectContract(cart.data, cartShape)

    const line = cart.data.items[0]
    const placed = await call('POST', '/orders', 1, {
      items: [
        { optionId: Number(line.optionId), childId: null, quantity: 1, unitPrice: line.unitPrice },
      ],
      shippingAddress: { recipientName: '홍길동', phone: '010', zipCode: '04524', address: '서울' },
    })
    expectContract(placed.data, orderDetailShape)
    const orderId = placed.data.orderId

    // 서버 이벤트(결제)는 2초 뒤에 끝난다
    let order = placed
    for (let i = 0; i < 20 && order.data.status === 'PENDING_PAYMENT'; i++) {
      await new Promise((resolve) => setTimeout(resolve, 250))
      order = await call('GET', `/orders/${orderId}`, 1)
    }
    expect(order.data.status).toBe('PAID')
    expectContract(order.data, orderDetailShape)
    expectContract((await call('GET', '/orders', 1)).data, orderPageShape)

    const payments = await call('GET', '/payments', 1)
    expectContract(payments.data, paymentPageShape)
    expect(payments.data.content[0]).toMatchObject({
      orderId: Number(orderId),
      status: 'COMPLETED',
    })
    expectContract(
      (await call('GET', `/payments/${payments.data.content[0].paymentId}`, 1)).data,
      paymentDetailShape,
    )

    const sellerOrders = await call('GET', '/seller/orders', 2)
    expectContract(sellerOrders.data, sellerOrderPageShape)
    const sellerOrderId = sellerOrders.data.content[0].sellerOrderId
    const shipped = await call('POST', `/seller/orders/${sellerOrderId}/ship`, 2, {
      carrier: 'CJ',
      trackingNumber: '1234',
    })
    expectContract(shipped.data, deliveryShape)
    const delivered = await call('POST', `/seller/orders/${sellerOrderId}/deliver`, 2)
    expectContract(delivered.data, deliveryShape)
    expect(delivered.data.status).toBe('DELIVERED')
    expectContract((await call('GET', '/seller/orders', 2)).data, sellerOrderPageShape)

    const itemId = order.data.items[0].orderItemId
    expect((await call('POST', `/orders/${orderId}/items/${itemId}/confirm`, 1)).status).toBe(200)
    expectContract((await call('GET', `/orders/${orderId}`, 1)).data, orderDetailShape)

    // 리뷰 (BE community): 구매확정한 주문상품이 작성 가능 목록에 나오고, 쓰면 빠지고 상품 리뷰 · 요약에 반영된다
    const eligible = await call('GET', '/reviews/eligible', 1)
    expectContract(eligible.data, reviewableItemsShape)
    const target = eligible.data.items.find(
      (item: { orderItemId: string }) => item.orderItemId === itemId,
    )
    expect(target).toMatchObject({ orderId: String(orderId) })
    const uploads = await call(
      'POST',
      '/reviews/images/upload-urls',
      1,
      toReviewUploadRequest([new Blob(['x'], { type: 'image/jpeg' })]),
    )
    expectContract(uploads.data, reviewImageUploadShape)
    const draft = {
      rating: 5,
      fit: target.size === null ? null : ('TRUE_TO_SIZE' as const),
      content: ' 잘 맞아요 ',
      imageUrls: [uploads.data.files[0].imageUrl],
    }
    const written = await call('POST', '/reviews', 1, toWriteReviewRequest(itemId, draft))
    expect(written.status).toBe(201)
    expectContract(written.data, reviewShape)
    expect(written.data).toMatchObject({ rating: 5, content: '잘 맞아요', nickname: '회원1' })
    expect((await call('POST', '/reviews', 1, toWriteReviewRequest(itemId, draft))).status).toBe(
      409,
    )
    expect(
      (await call('POST', '/reviews', 2, toWriteReviewRequest(itemId, draft))).status,
    ).toBeOneOf([403, 409])
    const productId = written.data.productId
    const listed = await call('GET', `/reviews?productId=${productId}&size=1`, null)
    expectContract(listed.data, reviewListShape)
    expect(listed.data.items[0].reviewId).toBe(written.data.reviewId)
    const summary = await call('GET', `/reviews/summary?productId=${productId}`, null)
    expectContract(summary.data, reviewSummaryShape)
    expect(summary.data.reviewCount).toBeGreaterThanOrEqual(1)
    expectContract((await call('GET', '/reviews/me', 1)).data, reviewListShape)
    const after = await call('GET', '/reviews/eligible', 1)
    expect(after.data.items.map((item: { orderItemId: string }) => item.orderItemId)).not.toContain(
      itemId,
    )
    const review = toReview(written.data)
    const patched = await call(
      'PATCH',
      `/reviews/${review.id}`,
      1,
      toUpdateReviewRequest(review, { ...draft, rating: 3, imageUrls: [] }),
    )
    expectContract(patched.data, reviewShape)
    expect(patched.data).toMatchObject({ rating: 3, imageUrls: [] })
    expect((await call('PATCH', `/reviews/${review.id}`, 1, {})).status).toBe(400)
    expect((await call('DELETE', `/reviews/${review.id}`, 2)).status).toBe(403)
    expect((await call('DELETE', `/reviews/${review.id}`, 1)).status).toBe(204)
  }, 15_000)

  it('관리자 회원 목록 · 이용 정지 · 판매자 자격 정지', async () => {
    expectContract(
      (await call('GET', '/admin/members?filter=SELLER', 3)).data,
      adminMemberPageShape,
    )
    const suspended = await call('POST', '/admin/sellers/2/suspend', 3, { reason: '정책 위반' })
    expectContract(suspended.data, sellerShape)
    expect((await call('POST', '/admin/members/1/suspend', 3, { reason: '테스트' })).status).toBe(
      204,
    )
    const list = await call('GET', '/admin/members?filter=SUSPENDED', 3)
    expectContract(list.data, adminMemberPageShape)
    expect(list.data.content[0]).toMatchObject({
      id: 1,
      status: 'SUSPENDED',
      suspendReason: '테스트',
    })
  })

  it('회원에는 관리자 역할이 없다 (BE #762)', async () => {
    expect((await call('GET', '/admin/members?filter=ADMIN', 3)).status).toBe(400)
    const all = await call('GET', '/admin/members?filter=ALL', 3)
    expectContract(all.data, adminMemberPageShape)
    expect(all.data.content.map((m: { id: number }) => m.id)).toContain(3)
    expect(all.data.content[0]).not.toHaveProperty('role')
    const devAdmin = await call('POST', '/dev/tokens', null, { memberId: 3, roles: ['ADMIN'] })
    expect(devAdmin.status).toBe(400)
  })

  it('관리자 로그인 · 재발급 · 로그아웃 (BE #736)', async () => {
    const wrong = await call('POST', '/auth/admin/login', null, {
      ...ADMIN_LOGIN,
      password: 'wrong-password',
    })
    expect(wrong.status).toBe(401)
    expect(wrong.data).toMatchObject({ status: 401, detail: '다시 확인해 주세요.' })

    const login = await fetch(`${BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(ADMIN_LOGIN),
    })
    const cookie = login.headers.get('set-cookie') ?? ''
    expect(cookie).toContain('admin_refresh_token=')
    expect(cookie).toContain('Path=/api/v1/auth/admin')

    const reissue = await fetch(`${BASE}/auth/admin/reissue`, {
      method: 'POST',
      headers: { cookie: cookie.split(';')[0] },
    })
    expect(reissue.status).toBe(200)
    expectContract(await reissue.json(), tokenShape)
    expect((await call('POST', '/auth/admin/reissue', null)).status).toBe(401)
    expect((await call('POST', '/auth/admin/logout', null)).status).toBe(204)
  })

  it('처리 실패 메시지 목록 · 상세 · 재처리 (BE #962, 네 모듈 같은 칸)', async () => {
    for (const module of ['auth', 'member', 'seller', 'child-profile']) {
      for (const status of ['OPEN', 'REPROCESSED']) {
        const list = await call('GET', `/admin/${module}-dead-letters?status=${status}`, 3)
        expect(list.status).toBe(200)
        expectContract(list.data, deadLetterPageShape)
      }
    }
    expect((await call('GET', '/admin/member-dead-letters?status=DONE', 3)).status).toBe(400)
    expect((await call('GET', '/admin/member-dead-letters', 1)).status).toBe(403)

    const bare = (await call('GET', '/admin/seller-dead-letters?status=OPEN', 3)).data.content[0]
    expectContract(bare, deadLetterShape)
    expect(bare).toMatchObject({ eventType: null, failureType: null, sourceOffset: null })

    const ok = await call('POST', '/__fake/dead-letters', null, { module: 'member' })
    const path = `/admin/member-dead-letters/${ok.data.deadLetterId}`
    expectContract((await call('GET', path, 3)).data, deadLetterShape)
    const done = await call('POST', `${path}/reprocess`, 3)
    expect(done.status).toBe(200)
    expectContract(done.data, deadLetterShape)
    expect(done.data).toMatchObject({ status: 'REPROCESSED', replayCount: 1, lastReplayedBy: '1' })
    // 이미 재처리 완료면 다시 실행하지 않고 그대로 200
    expect((await call('POST', `${path}/reprocess`, 3)).data).toMatchObject({
      status: 'REPROCESSED',
      replayCount: 1,
    })

    const bad = await call('POST', '/__fake/dead-letters', null, {
      module: 'member',
      failOnReplay: true,
    })
    const failed = await call(
      'POST',
      `/admin/member-dead-letters/${bad.data.deadLetterId}/reprocess`,
      3,
    )
    expect(failed.status).toBe(200)
    expectContract(failed.data, deadLetterShape)
    expect(failed.data).toMatchObject({
      status: 'OPEN',
      replayCount: 1,
      lastReplayFailureType: 'java.lang.IllegalStateException',
    })

    // 다른 모듈의 번호로는 찾지 못한다
    expect((await call('GET', `/admin/auth-dead-letters/${ok.data.deadLetterId}`, 3)).status).toBe(
      404,
    )
    expect((await call('POST', '/admin/auth-dead-letters/99999/reprocess', 3)).status).toBe(404)
  })

  it('관리자 API는 관리자 토큰만 받는다 (BE #755: 회원 토큰은 403)', async () => {
    expect((await call('GET', '/admin/members', 1)).status).toBe(403)
    expect((await call('GET', '/admin/members', null)).status).toBe(401)
    expect((await call('GET', '/admin/members', 3)).status).toBe(200)
  })

  it('충전 승인 · 충전 조회', async () => {
    const confirmed = await call('POST', '/wallets/me/charges/confirm', 1, {
      paymentKey: 'pk',
      orderId: 'toss-77',
      amount: 50000,
    })
    expectContract(confirmed.data, chargeConfirmShape)
    expectContract((await call('GET', '/wallets/me/charges/77', 1)).data, chargeShape)
    const list = await call('GET', '/wallets/me/charges', 1)
    expectContract(list.data, chargePageShape)
    expect(list.data.content[0]).toMatchObject({ chargeId: 77, status: 'DONE' })
  })

  it('결제창이 끝나지 않은 충전을 실패로 (BE ChargeDetailResponse)', async () => {
    const failed = await call('POST', '/wallets/me/charges/fail', 1, {
      orderId: 'toss-fail',
      code: 'PAY_PROCESS_CANCELED',
    })
    expect(failed.status).toBe(200)
    expectContract(failed.data, chargeShape)
    expect(failed.data).toMatchObject({ orderId: 'toss-fail', status: 'FAILED' })
  })

  it('충전 취소 (BE ChargeCancelResponse)', async () => {
    const cancelled = await call('POST', '/wallets/me/charges/77/cancel', 1)
    expectContract(cancelled.data, chargeCancelShape)
    expect(cancelled.data).toMatchObject({ chargeId: 77, status: 'CANCELLED', amount: 50000 })
  })

  it('예치금 거래 내역 (BE WalletLedgerResponse): 충전 + · 충전 취소 −, 최신이 위', async () => {
    const list = await call('GET', '/wallets/me/ledgers', 1)
    expectContract(list.data, walletLedgerPageShape)
    expect(list.data.content.slice(0, 2)).toMatchObject([
      { type: 'CHARGE_CANCEL', amount: -50000, refId: 77 },
      { type: 'CHARGE', amount: 50000, refId: 77 },
    ])
  })
})

describe('상품 이미지 업로드 주소 발급 (BE SellerProductImageController)', () => {
  const S3_IMAGE =
    /^https:\/\/team04-kidly-s3\.s3\.ap-northeast-2\.amazonaws\.com\/dev\/products\/2\/[\w-]+\.(jpg|webp)$/
  const jpeg = { contentType: 'image/jpeg', contentLength: 1000 }

  it('판매자는 요청 순서대로 업로드 주소 · 저장 주소 · 서울 시간 만료 시각을 받는다', async () => {
    const issued = await call('POST', '/seller/product-images/upload-urls', 2, {
      files: [jpeg, { contentType: 'image/webp', contentLength: 2000 }],
    })
    expect(issued.status).toBe(200)
    expectContract(issued.data, productImageUploadUrlsShape)
    const uploads = issued.data.uploads as {
      uploadUrl: string
      imageUrl: string
      expiresAt: string
    }[]
    expect(uploads.map((upload) => upload.imageUrl.split('.').at(-1))).toEqual(['jpg', 'webp'])
    for (const upload of uploads) {
      expect(upload.imageUrl).toMatch(S3_IMAGE)
      expect(upload.uploadUrl.startsWith(`${upload.imageUrl}?`)).toBe(true)
      expect(upload.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
    }
  })

  it.each([
    [null, 401],
    [1, 403],
  ])('회원 %s는 %i', async (as, status) => {
    const issued = await call('POST', '/seller/product-images/upload-urls', as, { files: [jpeg] })
    expect(issued.status).toBe(status)
  })

  it('형식이 틀리면 400, detail은 "필드: 메시지"', async () => {
    const issued = await call('POST', '/seller/product-images/upload-urls', 2, {
      files: [jpeg, { contentType: 'image/svg+xml', contentLength: 1000 }],
    })
    expect(issued.status).toBe(400)
    expect(issued.data).toMatchObject({
      title: '잘못된 요청입니다',
      detail: 'files[1].contentType: jpeg, png, webp 이미지만 올릴 수 있습니다.',
    })
  })
})

describe('상품 (실제 API): 등록 → 판매 시작 → 상세 → 시드 없이 담기', () => {
  it('카테고리 입력 항목으로 만든 등록 요청이 받아지고, 판매 시작하면 주문 복사본이 생긴다', async () => {
    const tree = await call('GET', '/categories', null)
    expectContract(tree.data, categoryTreeShape)
    const inputsResponse = await call('GET', '/categories/11/attributes', null)
    expectContract(inputsResponse.data, categoryInputsShape)
    const inputs = toCategoryInputs(inputsResponse.data)

    const registered = await call(
      'POST',
      '/seller/products',
      2,
      toRegisterProductRequest(inputs, demoRegisterForm(inputs)),
    )
    expect(registered.status).toBe(201)
    expectContract(registered.data, registerProductResultShape)
    const { productId, options } = registered.data
    expect(options.map((option: { optionName: string }) => option.optionName)).toEqual([
      '네이비 / 110',
      '네이비 / 120',
    ])
    // 판매 시작 전에는 상세가 404 (BE: 구매자에게 안 보임)
    expect((await call('GET', `/products/${productId}`, null)).status).toBe(404)

    const started = await call('PUT', `/seller/products/${productId}/sale-status`, 2, {
      status: 'ON_SALE',
    })
    expectContract(started.data, saleStatusResultShape)
    expect(started.data).toMatchObject({ productId, status: 'ON_SALE' })
    // 다시 보내도 그대로 200 · 남의 상품은 403
    expect(
      (await call('PUT', `/seller/products/${productId}/sale-status`, 2, { status: 'ON_SALE' }))
        .status,
    ).toBe(200)
    expect(
      (await call('PUT', `/seller/products/${productId}/sale-status`, 1, { status: 'ON_SALE' }))
        .status,
    ).toBe(403)

    const detail = await call('GET', `/products/${productId}`, null)
    expectContract(detail.data, productDetailShape)

    const optionId = options[1].optionId
    expect(
      (
        await call(
          'POST',
          '/cart/items',
          1,
          toAddCartItemRequest({ optionId, childId: null, quantity: 1 }),
        )
      ).status,
    ).toBeLessThan(300)
    const cart = await call('GET', '/cart', 1)
    const line = cart.data.items.find((item: { optionId: string }) => item.optionId === optionId)
    expect(line).toMatchObject({ productId, optionName: '네이비 / 120', unitPrice: 25000 })
    const placed = await call('POST', '/orders', 1, {
      items: [{ optionId: Number(optionId), childId: null, quantity: 1, unitPrice: 25000 }],
      shippingAddress: { recipientName: '홍길동', phone: '010', zipCode: '04524', address: '서울' },
    })
    expect(placed.status).toBe(201)
    expectContract(placed.data, orderDetailShape)
  })
})

describe('판매자 상품 상세 · 수정 (BE SellerProductDetailResponse · PUT ProductUpdateRequest)', () => {
  const S3_IMAGE = 'https://team04-kidly-s3.s3.ap-northeast-2.amazonaws.com/dev/products/2/a.jpg'

  async function registerAndRead() {
    const inputs: CategoryInputs = toCategoryInputs(
      (await call('GET', '/categories/11/attributes', null)).data,
    )
    const registered = await call(
      'POST',
      '/seller/products',
      2,
      toRegisterProductRequest(inputs, demoRegisterForm(inputs)),
    )
    const read = async () => await call('GET', `/seller/products/${registered.data.productId}`, 2)
    return { inputs, productId: registered.data.productId as string, read }
  }

  it('상세는 수정 요청과 같은 모양이고, 그대로 고쳐 보내면 200 · version이 오른다', async () => {
    const { inputs, productId, read } = await registerAndRead()
    const before = await read()
    expect(before.status).toBe(200)
    expectContract(before.data, sellerProductDetailShape)
    const detail = toSellerProductDetail(before.data)
    const form = toEditableProductForm(inputs, detail)

    const updated = await call(
      'PUT',
      `/seller/products/${productId}`,
      2,
      toProductUpdateRequest(
        inputs,
        { ...form, name: '데일리 맨투맨 (수정)', imageUrls: [S3_IMAGE] },
        detail,
      ),
    )
    expect(updated.status).toBe(200)
    expectContract(updated.data, sellerProductDetailShape)
    expect(updated.data).toMatchObject({
      name: '데일리 맨투맨 (수정)',
      version: detail.version + 1,
      thumbnailUrl: S3_IMAGE,
      imageUrls: [S3_IMAGE],
    })
    // 읽어 간 version이 오래되면 409
    const stale = toProductUpdateRequest(inputs, form, detail)
    expect((await call('PUT', `/seller/products/${productId}`, 2, stale)).status).toBe(409)
  })

  it('등록 취소(판매자)는 판매 상태 응답 모양이고, 그 뒤 판매 상태 · 수정은 409, 관리자가 판매 중지로 되돌린다', async () => {
    const { inputs, productId, read } = await registerAndRead()
    await call('PUT', `/seller/products/${productId}/sale-status`, 2, { status: 'ON_SALE' })
    const delisted = await call('PUT', `/seller/products/${productId}/delisting`, 2)
    expect(delisted.status).toBe(200)
    expectContract(delisted.data, saleStatusResultShape)
    expect(delisted.data.status).toBe('DELISTED')
    // 다시 보내도 그대로 200
    expect((await call('PUT', `/seller/products/${productId}/delisting`, 2)).status).toBe(200)

    const detail = toSellerProductDetail((await read()).data)
    expect(detail.status).toBe('DELISTED')
    const update = toProductUpdateRequest(inputs, toEditableProductForm(inputs, detail), detail)
    expect((await call('PUT', `/seller/products/${productId}`, 2, update)).status).toBe(409)
    const restart = { status: 'ON_SALE' }
    expect(
      (await call('PUT', `/seller/products/${productId}/sale-status`, 2, restart)).status,
    ).toBe(409)

    const reverted = await call('DELETE', `/admin/products/${productId}/delisting`, 3)
    expect(reverted.status).toBe(200)
    expectContract(reverted.data, saleStatusResultShape)
    expect(reverted.data.status).toBe('STOPPED')
    // 등록 취소한 상품이 아니면 409, 관리자만
    expect((await call('DELETE', `/admin/products/${productId}/delisting`, 3)).status).toBe(409)
    expect((await call('DELETE', `/admin/products/${productId}/delisting`, 2)).status).toBe(403)
  })

  it('판매를 시작하면 옵션 · 가격 · 실측을 보내면 409, 셋 다 null이면 200', async () => {
    const { inputs, productId, read } = await registerAndRead()
    await call('PUT', `/seller/products/${productId}/sale-status`, 2, { status: 'ON_SALE' })
    const detail = toSellerProductDetail((await read()).data)
    const form = toEditableProductForm(inputs, detail)
    const locked = toProductUpdateRequest(inputs, form, { ...detail, status: 'SALE_PENDING' })
    expect((await call('PUT', `/seller/products/${productId}`, 2, locked)).status).toBe(409)
    const nameOnly = toProductUpdateRequest(inputs, { ...form, name: '이름만' }, detail)
    expect(nameOnly).toMatchObject({ options: null, prices: null, sizeSpecs: null })
    expect((await call('PUT', `/seller/products/${productId}`, 2, nameOnly)).status).toBe(200)
  })

  it('관리자 상품 기준 데이터: 항목 · 목록 값 만들기와 목록 (BE #405)', async () => {
    const created = await call(
      'POST',
      '/admin/attributes',
      3,
      toAttributeCreateRequest({
        name: '계약 소재',
        code: 'CONTRACT_MATERIAL',
        inputType: 'PALETTE',
        values: [{ name: '면', colorCode: '#ffffff' }],
      }),
    )
    expect(created.status).toBe(201)
    expectContract(created.data, attributeShape)
    const added = await call(
      'POST',
      `/admin/attributes/${created.data.attributeId}/values`,
      3,
      toAttributeValueRequest({ name: '린넨', colorCode: '#e3d3bc' }, 'PALETTE'),
    )
    expect(added.status).toBe(201)
    expectContract(added.data, attributeValueShape)
    expectContract((await call('GET', '/admin/attributes', 3)).data, arr(attributeShape))
    // 같은 코드는 409, 같은 항목에 같은 값 이름도 409, 없는 항목은 404
    expect((await call('POST', '/admin/attributes', 3, created.data)).status).toBe(409)
    const again = `/admin/attributes/${created.data.attributeId}/values`
    expect((await call('POST', again, 3, added.data)).status).toBe(409)
    expect((await call('POST', '/admin/attributes/999999/values', 3, added.data)).status).toBe(404)
  })

  it('관리자 상품 기준 데이터: 상품 유형 만들기와 목록 (BE #424)', async () => {
    const [color] = (await call('GET', '/admin/attributes', 3)).data
    const link = {
      attributeId: color.attributeId,
      role: 'OPTION' as const,
      required: true,
      allValuesAllowed: false,
      sizeRole: false,
      priceAffecting: false,
      allowedValueIds: [color.values[0].valueId],
    }
    const request = toProductTypeCreateRequest({ name: '계약 유형', links: [link] })
    const created = await call('POST', '/admin/product-types', 3, request)
    expect(created.status).toBe(201)
    expectContract(created.data, productTypeShape)
    expect(created.data.attributes[0].allowedValues).toHaveLength(1)
    expectContract((await call('GET', '/admin/product-types', 3)).data, arr(productTypeShape))
    // 같은 이름은 409, boolean 칸이 빠지면 400
    expect((await call('POST', '/admin/product-types', 3, request)).status).toBe(409)
    const withoutRequired = { ...request.attributes[0], required: undefined }
    const missing = { name: '빠진 칸', attributes: [withoutRequired] }
    expect((await call('POST', '/admin/product-types', 3, missing)).status).toBe(400)
  })

  it('관리자 상품 기준 데이터: 상품 유형 수정 PUT은 연결 목록 전체로 바꾸고, 상품이 있는 유형은 넓히는 변경만 받는다', async () => {
    const [clothing, ...others] = (await call('GET', '/admin/product-types', 3)).data
    const created = others.find((type: { name: string }) => type.name === '계약 유형')
    const form = toProductTypeForm(toProductType(created))
    const [color, size] = (await call('GET', '/admin/attributes', 3)).data
    // 상품이 없는 유형: 새 옵션 항목을 앞에 더해도 된다. 응답은 목록의 유형 하나와 같은 모양
    const sizeLink = {
      ...form.links[0],
      attributeId: size.attributeId,
      allValuesAllowed: true,
      allowedValueIds: [],
    }
    const changed = await call(
      'PUT',
      `/admin/product-types/${created.productTypeId}`,
      3,
      toProductTypeChangeRequest({ ...form, links: [sizeLink, ...form.links] }),
    )
    expect(changed.status).toBe(200)
    expectContract(changed.data, productTypeShape)
    expect(changed.data.attributes.map((a: { attributeId: string }) => a.attributeId)).toEqual([
      size.attributeId,
      color.attributeId,
    ])

    // 상품이 있는 유형(의류): 그대로 보내면 200, 옵션 순서를 바꾸면 409, 없는 유형은 404
    const clothingForm = toProductTypeForm(toProductType(clothing))
    const url = `/admin/product-types/${clothing.productTypeId}`
    expect((await call('PUT', url, 3, toProductTypeChangeRequest(clothingForm))).status).toBe(200)
    const [first, second, ...rest] = clothingForm.links
    const swapped = toProductTypeChangeRequest({ ...clothingForm, links: [second, first, ...rest] })
    expect((await call('PUT', url, 3, swapped)).status).toBe(409)
    expect((await call('PUT', '/admin/product-types/999999', 3, swapped)).status).toBe(404)
  })

  it('관리자 상품 기준 데이터: 카테고리 만들기와 목록 (BE #425)', async () => {
    const [type] = (await call('GET', '/admin/product-types', 3)).data
    const [item] = (await call('GET', '/admin/measurement-items', 3)).data
    const middle = await call(
      'POST',
      '/admin/categories',
      3,
      toCategoryCreateRequest({
        name: '계약 신발',
        parentId: '',
        kind: 'MIDDLE',
        productTypeId: type.productTypeId,
        measurementItemIds: [item.measurementItemId],
      }),
    )
    expect(middle.status).toBe(201)
    expectContract(middle.data, categoryShape)
    const leafRequest = toCategoryCreateRequest({
      name: '계약 운동화',
      parentId: middle.data.categoryId,
      kind: 'LEAF',
      productTypeId: type.productTypeId,
      measurementItemIds: [item.measurementItemId],
    })
    const leaf = await call('POST', '/admin/categories', 3, leafRequest)
    expect(leaf.status).toBe(201)
    expectContract(leaf.data, categoryShape)
    expectContract((await call('GET', '/admin/categories', 3)).data, arr(categoryShape))
    // 같은 위치 같은 이름은 409, 말단 아래는 400
    expect((await call('POST', '/admin/categories', 3, leafRequest)).status).toBe(409)
    const underLeaf = { ...leafRequest, name: '더 아래', parentId: leaf.data.categoryId }
    expect((await call('POST', '/admin/categories', 3, underLeaf)).status).toBe(400)
  })

  it('관리자 상품 기준 데이터: 카테고리 수정 PUT은 유형과 실측 항목을 바꾸고, 상품이 있는 카테고리는 빼기 · 순서 변경만 받는다', async () => {
    const categories = (await call('GET', '/admin/categories', 3)).data.map(toCatalogCategory)
    const [type, other] = (await call('GET', '/admin/product-types', 3)).data
    const [length, shoulder] = (await call('GET', '/admin/measurement-items', 3)).data
    // 상품이 없는 말단(하의): 유형을 바꾸고 실측 항목을 더해도 된다. 응답은 목록의 카테고리 하나와 같은 모양
    const bottom = categories.find((c: CatalogCategory) => c.name === '하의')!
    const changed = await call(
      'PUT',
      `/admin/categories/${bottom.id}`,
      3,
      toCategoryChangeRequest({
        productTypeId: other.productTypeId,
        measurementItemIds: [shoulder.measurementItemId, length.measurementItemId],
      }),
    )
    expect(changed.status).toBe(200)
    expectContract(changed.data, categoryShape)
    expect(changed.data.productTypeId).toBe(other.productTypeId)
    expect(changed.data.measurementItems.map((m: { code: string }) => m.code)).toEqual([
      'SHOULDER_WIDTH',
      'TOTAL_LENGTH',
    ])

    // 상품이 있는 말단(상의): 순서 바꾸기는 200, 유형을 바꾸면 409. 중간은 400, 없는 카테고리는 404
    const top = categories.find((c: CatalogCategory) => c.name === '상의')!
    const url = `/admin/categories/${top.id}`
    const reversed = toCategoryChangeForm(top)
    reversed.measurementItemIds.reverse()
    expect((await call('PUT', url, 3, toCategoryChangeRequest(reversed))).status).toBe(200)
    const retyped = toCategoryChangeRequest({ ...reversed, productTypeId: other.productTypeId })
    expect((await call('PUT', url, 3, retyped)).status).toBe(409)
    const middle = categories.find((c: CatalogCategory) => c.name === '의류')!
    const sameType = toCategoryChangeRequest({ ...reversed, productTypeId: type.productTypeId })
    expect((await call('PUT', `/admin/categories/${middle.id}`, 3, sameType)).status).toBe(400)
    expect((await call('PUT', '/admin/categories/999999', 3, sameType)).status).toBe(404)
  })

  it('관리자 상품 기준 데이터 삭제: 204로 지우고 목록에서 빠지며, 쓰이는 중이면 409 · 없으면 404', async () => {
    const ids = async (path: string, key: string) =>
      (await call('GET', path, 3)).data.map((row: Record<string, string>) => row[key])
    const del = async (path: string) => (await call('DELETE', path, 3)).status

    // 항목: 유형에 연결된 색상은 409, 연결 없는 새 항목은 204. 목록 값은 막는 경우가 없다
    const attributes = (await call('GET', '/admin/attributes', 3)).data
    const color = attributes.find((a: { code: string }) => a.code === 'COLOR')
    expect(await del(`/admin/attributes/${color.attributeId}`)).toBe(409)
    const loose = await call(
      'POST',
      '/admin/attributes',
      3,
      toAttributeCreateRequest({
        name: '지울 항목',
        code: 'TO_DELETE',
        inputType: 'LIST',
        values: [
          { name: '하나', colorCode: '' },
          { name: '둘', colorCode: '' },
        ],
      }),
    )
    const looseUrl = `/admin/attributes/${loose.data.attributeId}`
    const [one] = loose.data.values
    expect(await del(`${looseUrl}/values/${one.valueId}`)).toBe(204)
    const looseAfter = (await call('GET', '/admin/attributes', 3)).data.find(
      (a: { attributeId: string }) => a.attributeId === loose.data.attributeId,
    )
    expect(looseAfter.values.map((v: { name: string }) => v.name)).toEqual(['둘'])
    expect(await del(`${looseUrl}/values/${one.valueId}`)).toBe(404)
    expect(await del(looseUrl)).toBe(204)
    expect(await ids('/admin/attributes', 'attributeId')).not.toContain(loose.data.attributeId)
    expect(await del(looseUrl)).toBe(404)

    // 실측 항목: 카테고리가 필수로 연결했으면 409
    const [length] = (await call('GET', '/admin/measurement-items', 3)).data
    expect(await del(`/admin/measurement-items/${length.measurementItemId}`)).toBe(409)
    const unused = await call(
      'POST',
      '/admin/measurement-items',
      3,
      toMeasurementItemRequest({ name: '지울 길이', code: 'TO_DELETE_LENGTH', unit: 'cm' }),
    )
    expect(await del(`/admin/measurement-items/${unused.data.measurementItemId}`)).toBe(204)
    expect(await ids('/admin/measurement-items', 'measurementItemId')).not.toContain(
      unused.data.measurementItemId,
    )

    // 카테고리: 하위가 있으면 409, 말단은 204. 상품 유형: 카테고리가 가리키면 409
    const categories = (await call('GET', '/admin/categories', 3)).data
    const clothing = categories.find((c: { name: string }) => c.name === '의류')
    expect(await del(`/admin/categories/${clothing.categoryId}`)).toBe(409)
    const bottom = categories.find((c: { name: string }) => c.name === '하의')
    expect(await del(`/admin/categories/${bottom.categoryId}`)).toBe(204)
    expect(await ids('/admin/categories', 'categoryId')).not.toContain(bottom.categoryId)
    expect(await del('/admin/categories/999999')).toBe(404)
    const top = categories.find((c: { name: string }) => c.name === '상의')
    expect(await del(`/admin/product-types/${top.productTypeId}`)).toBe(409)
    const type = await call(
      'POST',
      '/admin/product-types',
      3,
      toProductTypeCreateRequest({
        name: '지울 유형',
        links: [
          {
            attributeId: color.attributeId,
            role: 'OPTION',
            required: true,
            allValuesAllowed: true,
            sizeRole: false,
            priceAffecting: false,
            allowedValueIds: [],
          },
        ],
      }),
    )
    expect(await del(`/admin/product-types/${type.data.productTypeId}`)).toBe(204)
    expect(await ids('/admin/product-types', 'productTypeId')).not.toContain(
      type.data.productTypeId,
    )
  })

  it('추천 기준 옷: 저장(교체) · 목록 · 삭제와 거절 (BE #1111)', async () => {
    const child = await call('POST', '/children', 1, {
      ...toChildRequest(DEMO_CHILD),
      requiredConsent: true,
      optionalConsent: true,
    })
    const url = `/recommendations/children/${child.data.id}/reference-garments`
    expect((await call('GET', url, 1)).data).toEqual([])

    const top = toReferenceGarmentRequest({
      categoryId: '11',
      measurements: { TOTAL_LENGTH: '42', CHEST_WIDTH: '34.5', SHOULDER_WIDTH: '28' },
    })
    const saved = await call('PUT', `${url}/TOP`, 1, top)
    expect(saved.status).toBe(200)
    expectContract(saved.data, referenceGarmentShape)
    // 다시 저장하면 교체: 뺀 선택 실측은 사라진다
    const withoutShoulder = { TOTAL_LENGTH: 42, CHEST_WIDTH: 34.5 }
    const replaced = await call('PUT', `${url}/TOP`, 1, { ...top, measurements: withoutShoulder })
    expect(Object.keys(replaced.data.measurements).sort()).toEqual(['CHEST_WIDTH', 'TOTAL_LENGTH'])
    const bottom = { categoryId: '12', measurements: { TOTAL_LENGTH: 60, WAIST_WIDTH: 25 } }
    expect((await call('PUT', `${url}/BOTTOM`, 1, bottom)).status).toBe(200)
    const list = await call('GET', url, 1)
    expectContract(list.data, referenceGarmentListShape)
    expect(list.data.map((item: { part: string }) => item.part)).toEqual(['TOP', 'BOTTOM'])

    // 거절: 소문자 구분 · 맞지 않는 세부 종류 · 필수 없음 · 범위 밖 값은 400, 남의 자녀 403, 없는 자녀 404
    expect((await call('PUT', `${url}/top`, 1, top)).status).toBe(400)
    expect((await call('PUT', `${url}/BOTTOM`, 1, top)).status).toBe(400)
    // 5칸: 아우터 · 원피스 · 치마도 구분이고, 상의 카테고리를 아우터 칸에 넣으면 맞지 않는 세부 종류로 거절한다
    const outerWithTop = await call('PUT', `${url}/OUTER`, 1, top)
    expect(outerWithTop.status).toBe(400)
    expect(outerWithTop.data.title).toBe('구분과 맞지 않는 세부 종류입니다')
    expect((await call('PUT', `${url}/SKIRT`, 1, bottom)).data.title).toBe(
      '구분과 맞지 않는 세부 종류입니다',
    )
    const noChest = { categoryId: '11', measurements: { TOTAL_LENGTH: 42 } }
    expect((await call('PUT', `${url}/TOP`, 1, noChest)).status).toBe(400)
    const tooLong = { categoryId: '11', measurements: { TOTAL_LENGTH: 200.1, CHEST_WIDTH: 30 } }
    expect((await call('PUT', `${url}/TOP`, 1, tooLong)).status).toBe(400)
    expect((await call('GET', url, 2)).status).toBe(403)
    expect(
      (await call('GET', '/recommendations/children/999999/reference-garments', 1)).status,
    ).toBe(404)

    // 지우기는 204, 이미 없어도 204
    expect((await call('DELETE', `${url}/TOP`, 1)).status).toBe(204)
    expect((await call('DELETE', `${url}/TOP`, 1)).status).toBe(204)
    expect((await call('GET', url, 1)).data.map((item: { part: string }) => item.part)).toEqual([
      'BOTTOM',
    ])
  })

  it('기준 옷 산 옷 목록: 이 자녀의 구매확정된 옷만, 산 사이즈 실측과 함께 (BE #1168)', async () => {
    const child = await call('POST', '/children', 1, {
      ...toChildRequest(DEMO_CHILD),
      requiredConsent: true,
      optionalConsent: true,
    })
    const url = `/recommendations/children/${child.data.id}/purchases`
    expect((await call('GET', url, 1)).data).toMatchObject({ content: [], totalElements: 0 })

    await call(
      'POST',
      '/cart/items',
      1,
      toAddCartItemRequest({ optionId: '2', childId: String(child.data.id), quantity: 1 }),
    )
    const cart = await call('GET', '/cart', 1)
    const line = cart.data.items.find(
      (item: { childId: string | null }) => item.childId === String(child.data.id),
    )
    const placed = await call('POST', '/orders', 1, {
      items: [
        {
          optionId: Number(line.optionId),
          childId: child.data.id,
          quantity: 1,
          unitPrice: line.unitPrice,
        },
      ],
      shippingAddress: { recipientName: '홍길동', phone: '010', zipCode: '04524', address: '서울' },
    })
    const orderId = placed.data.orderId
    let order = placed
    for (let i = 0; i < 20 && order.data.status === 'PENDING_PAYMENT'; i++) {
      await new Promise((resolve) => setTimeout(resolve, 250))
      order = await call('GET', `/orders/${orderId}`, 1)
    }
    // 배송 완료 전에는 목록에 없다
    expect((await call('GET', url, 1)).data.totalElements).toBe(0)
    const sellerOrder = (await call('GET', '/seller/orders', 2)).data.content.find(
      (item: { orderId: string }) => String(item.orderId) === String(orderId),
    )
    await call('POST', `/seller/orders/${sellerOrder.sellerOrderId}/ship`, 2, {
      carrier: 'CJ',
      trackingNumber: '1234',
    })
    await call('POST', `/seller/orders/${sellerOrder.sellerOrderId}/deliver`, 2)
    const item = order.data.items[0]
    await call('POST', `/orders/${orderId}/items/${item.orderItemId}/confirm`, 1)

    const list = await call('GET', url, 1)
    expectContract(list.data, purchasedGarmentPageShape)
    expect(list.data.content[0]).toMatchObject({
      orderItemId: item.orderItemId,
      productId: item.productId,
      size: item.size,
    })
    expect(list.data.content[0].measurements).not.toBeNull()
    expect((await call('GET', url, 2)).status).toBe(403)
    expect((await call('GET', '/recommendations/children/999999/purchases', 1)).status).toBe(404)
  })

  it('관리자 상품 기준 데이터: 실측 항목 만들기와 목록 (BE #405)', async () => {
    const item = await call(
      'POST',
      '/admin/measurement-items',
      3,
      toMeasurementItemRequest({ name: '계약 길이', code: 'CONTRACT_LENGTH', unit: 'cm' }),
    )
    expect(item.status).toBe(201)
    expectContract(item.data, measurementItemShape)
    expectContract(
      (await call('GET', '/admin/measurement-items', 3)).data,
      arr(measurementItemShape),
    )
    // 같은 코드는 409, 관리자만
    expect((await call('POST', '/admin/measurement-items', 3, item.data)).status).toBe(409)
    expect((await call('GET', '/admin/measurement-items', 1)).status).toBe(403)
  })
})

it('조르기 승인(예약 칸으로 주문하기) · 거절이 계약에 맞는다', async () => {
  const child = (
    await call('POST', '/children', 1, {
      ...toChildRequest(DEMO_CHILD),
      requiredConsent: true,
      optionalConsent: true,
    })
  ).data
  await call('POST', '/auth/child-accounts', 1, {
    childProfileId: child.id,
    loginId: 'wishchild',
    password: 'password1',
  })
  const login = await call('POST', '/auth/child/login', null, {
    loginId: 'wishchild',
    password: 'password1',
  })
  tokens[6] = login.data.accessToken
  const first = await call('POST', '/cart/items', 6, { optionId: 1, childId: null, quantity: 2 })
  const second = await call('POST', '/cart/items', 6, { optionId: 2, childId: null, quantity: 1 })
  const request = await call('POST', '/wish/requests', 6, {
    cartItemIds: [Number(first.data.cartItemId), Number(second.data.cartItemId)],
    message: '부탁해요',
  })
  expect(request.status).toBe(201)
  const id = request.data.requestId
  const waiting = await call('GET', `/wish/requests/${id}/timeline`, 1)
  expectContract(waiting.data, wishTimelineShape)
  expect(waiting.data.steps).toEqual([
    { step: 'SENT', status: 'DONE', at: request.data.requestedAt },
    { step: 'PAID', status: 'WAITING', at: null },
  ])
  expectContract(
    (await call('GET', `/wish/requests?childId=${child.id}`, 1)).data,
    wishRequestsShape,
  )
  expectContract((await call('GET', `/wish/requests/${id}`, 1)).data, wishRequestShape)
  // 승인 API는 없다 (#999)
  expect((await call('POST', `/wish/requests/${id}/approval`, 1, {})).status).toBe(404)
  const shippingAddress = { recipientName: '부모', phone: '010', zipCode: '12345', address: '서울' }
  const lineOf = (quantity: number) => ({
    optionId: 1,
    childId: child.id,
    quantity,
    unitPrice: first.data.unitPrice,
    cartItemId: Number(first.data.cartItemId),
  })
  const over = await call('POST', '/orders', 1, { items: [lineOf(3)], shippingAddress })
  expect(over.data).toMatchObject({ status: 409, title: '예약된 수량보다 많이 주문할 수 없습니다' })
  const placed = await call('POST', '/orders', 1, { items: [lineOf(1)], shippingAddress })
  expect(placed.status).toBe(201)
  expectContract(placed.data, orderDetailShape)
  let order = placed
  for (let i = 0; i < 20 && order.data.status === 'PENDING_PAYMENT'; i++) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    order = await call('GET', `/orders/${placed.data.orderId}`, 1)
  }
  expect(order.data.status).toBe('PAID')
  const paid = await call('GET', `/wish/requests/${id}`, 6)
  expectContract(paid.data, wishRequestShape)
  expect(paid.data).toMatchObject({ status: 'PAID', payerType: 'MEMBER', payerId: '1' })
  expect(paid.data.purchases).toMatchObject([
    { orderId: placed.data.orderId, cartItemId: first.data.cartItemId, quantity: 1 },
  ])
  const paidTimeline = await call('GET', `/wish/requests/${id}/timeline`, 1)
  expect(paidTimeline.data.orderIds).toEqual([placed.data.orderId])
  // 일부 수량만 사도 결제 완료이고, 칸은 남은 수량으로 예약 없이 남는다
  const childCart = (await call('GET', '/cart', 6)).data.items as {
    cartItemId: string
    quantity: number
    reserved: boolean
  }[]
  expect(childCart.find((line) => line.cartItemId === first.data.cartItemId)).toMatchObject({
    quantity: 1,
    reserved: false,
  })
  expect(childCart.find((line) => line.cartItemId === second.data.cartItemId)?.reserved).toBe(false)
  const decided = await call('POST', `/wish/requests/${id}/rejection`, 1, { reason: 'OTHER' })
  expect(decided.data).toMatchObject({ status: 409, title: '이미 처리한 조르기입니다' })
  const other = await call('POST', '/wish/requests', 6, {
    cartItemIds: [Number(second.data.cartItemId)],
    message: null,
  })
  const badReason = await call('POST', `/wish/requests/${other.data.requestId}/rejection`, 1, {
    reason: 'NOPE',
  })
  expect(badReason.data).toMatchObject({ status: 400, title: '잘못된 거절 사유입니다' })
  expect(
    (await call('POST', `/wish/requests/${other.data.requestId}/rejection`, 6, { reason: 'OTHER' }))
      .status,
  ).toBe(403)
  const rejected = await call('POST', `/wish/requests/${other.data.requestId}/rejection`, 1, {
    reason: 'OTHER',
  })
  expect(rejected.status).toBe(200)
  expectContract(rejected.data, wishRequestShape)
  expect(rejected.data).toMatchObject({ status: 'REJECTED', rejectReason: 'OTHER' })
  const rejectedTimeline = await call('GET', `/wish/requests/${other.data.requestId}/timeline`, 1)
  expect(rejectedTimeline.data.steps.map((step: { step: string }) => step.step)).toEqual([
    'SENT',
    'REJECTED',
  ])
  // 거절하면 예약이 풀린다
  const released = (await call('GET', '/cart', 6)).data.items.find(
    (line: { cartItemId: string }) => line.cartItemId === second.data.cartItemId,
  )
  expect(released.reserved).toBe(false)
})

it('부모 본인인증 계약과 등록 차단을 따른다', async () => {
  const token = await call('POST', '/dev/tokens', null, { memberId: 42, roles: ['BUYER'] })
  tokens[42] = token.data.accessToken
  const before = await call('GET', '/guardian-verification', 42)
  expect(before.data).toEqual({ verified: false, verifiedAt: null })
  expectContract(before.data, guardianVerificationShape)
  expect((await call('POST', '/children', 42, {})).status).toBe(403)
  const verified = await call('POST', '/guardian-verification', 42, {
    identityVerificationId: 'test',
  })
  expect(verified.status).toBe(201)
  expectContract(verified.data, guardianVerificationShape)
  expect(verified.data.verified).toBe(true)
})

it('상세 진입 기록은 로그인 회원만 204, 상품 ID가 없으면 400', async () => {
  const path = '/recommendations/product-views'
  const child = await call('POST', '/children', 1, {
    ...toChildRequest(DEMO_CHILD),
    requiredConsent: true,
    optionalConsent: true,
  })
  expect((await call('POST', path, 1, toProductViewRequest('1', null))).status).toBe(204)
  expect((await call('POST', path, 1, toProductViewRequest('1', child.data.id))).status).toBe(204)
  expect((await call('POST', path, null, toProductViewRequest('1', null))).status).toBe(401)
  expect((await call('POST', path, 1, {})).data.detail).toBe('productId: 상품 ID가 필요합니다.')
})

it.each([
  ['0', 400, 'childId: 자녀 ID는 1 이상이어야 합니다.'],
  ['99999', 404, '자녀를 찾을 수 없습니다.'],
])('상세 진입 기록: 자녀 %s → %i (BE #1112)', async (childId, status, detail) => {
  const viewed = await call(
    'POST',
    '/recommendations/product-views',
    1,
    toProductViewRequest('1', childId),
  )
  expect(viewed.status).toBe(status)
  expect(viewed.data.detail).toBe(detail)
})

it('맞춤 목록: 1쪽 응답의 기준 시각 asOf를 2쪽에 넘기면 그대로 돌려주고, 지금보다 늦으면 400 (BE #1151)', async () => {
  const child = await call('POST', '/children', 1, {
    ...toChildRequest(DEMO_CHILD),
    requiredConsent: true,
    optionalConsent: true,
  })
  const path = `/recommendations/products?childId=${child.data.id}&size=1`
  const first = await call('GET', path, 1)
  expect(first.status).toBe(200)
  expectContract(first.data, recommendedProductPageShape)

  const second = await call('GET', `${path}&page=1&asOf=${first.data.asOf}`, 1)
  expect(second.status).toBe(200)
  expect(second.data.asOf).toBe(first.data.asOf)

  const future = await call('GET', `${path}&page=1&asOf=2999-01-01T00:00:00`, 1)
  expect(future.status).toBe(400)
  expect(future.data.title).toBe('잘못된 기준 시각입니다')
})

it('함께 사면 좋은 상품: AI · RULE 응답 모두 계약 모양이고, 이유는 null일 수 있다 (BE #1164)', async () => {
  const child = await call('POST', '/children', 1, {
    ...toChildRequest(DEMO_CHILD),
    requiredConsent: true,
    optionalConsent: true,
  })
  const path = (productId: string) =>
    `/recommendations/companions?productId=${productId}&childId=${child.data.id}`

  const ai = await call('GET', path('1'), 1)
  expect(ai.status).toBe(200)
  expectContract(ai.data, companionProductsShape)
  expect(ai.data.source).toBe('AI')
  expect(ai.data.products.length).toBeLessThanOrEqual(4)

  const rule = await call('GET', path('2'), 1)
  expectContract(rule.data, companionProductsShape)
  expect(rule.data.source).toBe('RULE')
  expect(rule.data.products.every((p: { reason: unknown }) => p.reason === null)).toBe(true)

  expect((await call('GET', path('999999'), 1)).status).toBe(404)
  const missingChild = '/recommendations/companions?productId=1&childId=999999'
  expect((await call('GET', missingChild, 1)).status).toBe(404)
})

it('홈 맛보기 · 사이즈 추천: AI · RULE 응답 모두 계약 모양이다 (BE #1163 · #1162)', async () => {
  const sources: string[] = []
  const ids: string[] = []
  for (const optionalConsent of [true, false]) {
    const profile = toChildRequest(DEMO_CHILD)
    const child = await call('POST', '/children', 1, {
      ...profile,
      ...(optionalConsent ? {} : { bodyType: null, preferredFit: null }),
      requiredConsent: true,
      optionalConsent,
    })
    ids.push(child.data.id)
    const preview = await call(
      'GET',
      `/recommendations/products/preview?childId=${child.data.id}`,
      1,
    )
    expect(preview.status).toBe(200)
    expectContract(preview.data, homePreviewShape)
    sources.push(preview.data.source)
  }
  expect(sources).toEqual(['AI', 'RULE'])
  expect((await call('GET', '/recommendations/products/preview?childId=999999', 1)).status).toBe(
    404,
  )

  const childId = ids[0]
  const sizeSources: string[] = []
  for (const productId of ['1', '2']) {
    const size = await call(
      'GET',
      `/recommendations/size?productId=${productId}&childId=${childId}`,
      1,
    )
    expectContract(size.data, sizeRecommendationShape)
    sizeSources.push(size.data.source)
    if (size.data.source === 'RULE') expect(size.data.reasons).toEqual([])
  }
  expect(sizeSources).toEqual(['AI', 'RULE'])
})

it('검색: 관련도순 목록은 목록 응답 모양이고, 결과 클릭 기록은 로그인 회원만 204 (BE SearchClickRequest)', async () => {
  const params = new URLSearchParams(
    toProductSearchParams({ keyword: '맨투맨', categoryId: null }) as Record<string, string>,
  )
  expect(params.get('sort')).toBe('RELEVANCE')
  const list = await call('GET', `/products?${params}`, null)
  expect(list.status).toBe(200)
  expectContract(list.data, productListPageShape)
  expect((await call('GET', '/products?sort=POPULAR', null)).status).toBe(400)

  const click = toSearchClickRequest({
    keyword: '맨투맨',
    productId: '1',
    page: 0,
    size: 20,
    index: 0,
    sort: 'RELEVANCE',
  })
  expect((await call('POST', '/search/clicks', 1, click)).status).toBe(204)
  expect((await call('POST', '/search/clicks', null, click)).status).toBe(401)
  const tooFar = await call('POST', '/search/clicks', 1, { ...click, rank: 10001 })
  expect(tooFar.status).toBe(400)
  expect(tooFar.data.detail).toBe('순위는 1 이상 10000 이하여야 합니다.')
})
