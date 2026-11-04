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
  toCategoryCreateRequest,
  toAttributeValueRequest,
  toMeasurementItemRequest,
  toProductTypeCreateRequest,
} from '@/entities/catalog'
import { addressShape } from '@/entities/address/api/address.shape'
import { toAddCartItemRequest } from '@/entities/cart'
import { cartShape } from '@/entities/cart/api/cart.shape'
import { toChildRequest } from '@/entities/child'
import { childAccountShape } from '@/entities/child-account/api/child-account.shape'
import { childOnboardingShape } from '@/entities/child-onboarding'
import { childShape, growthRecordShape } from '@/entities/child/api/child.shape'
import { adminMemberPageShape } from '@/entities/member/api/member.shape'
import { orderDetailShape, orderPageShape } from '@/entities/order/api/order.shape'
import {
  wishShape,
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
  registerProductResultShape,
  saleStatusResultShape,
  sellerProductDetailShape,
} from '@/entities/product/api/product.shape'
import {
  toCategoryInputs,
  toEditableProductForm,
  toProductUpdateRequest,
  toRegisterProductRequest,
  type CategoryInputs,
} from '@/entities/product'
import { toSellerProductDetail } from '@/entities/product/model/product.mapper'
import { DEMO_ADDRESS } from '@/features/manage-address/config/demo-address'
import { demoRegisterForm } from '@/features/register-product/config/demo-product'
import { DEMO_APPLICATION } from '@/features/apply-seller/config/demo-application'
import { DEMO_CHILD } from '@/features/register-child/config/demo-child'
import { productImageUploadUrlsShape } from '@/features/upload-product-image'
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
    const child = await call('POST', '/children', 1, toChildRequest(DEMO_CHILD))
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
    expectContract((await call('GET', '/child/onboarding', 4)).data, childOnboardingShape)
    expect((await call('POST', '/child/onboarding/notice', 4)).status).toBe(204)
    // 프로필이 지워진 자녀도 첫 로그인 상태를 받는다 (프로필 없음)
    const orphan = await call('POST', '/children', 1, toChildRequest(DEMO_CHILD))
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
    const orphanStatus = await call('GET', '/child/onboarding', 5)
    expect(orphanStatus.status).toBe(200)
    expect(orphanStatus.data.hasProfile).toBe(false)
    expect(
      (
        await call('POST', '/child/consents', 4, {
          optionalAgreed: false,
          sellerProvisionAgreed: false,
          heightCm: null,
          weightKg: null,
          bodyType: null,
          preferredFit: null,
        })
      ).status,
    ).toBe(204)
    expectContract((await call('GET', '/child/profile', 4)).data, childShape)
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
      (await call('POST', '/children', 1, toChildRequest(DEMO_CHILD))).data,
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
    const extra = await call('POST', '/children', 1, toChildRequest(DEMO_CHILD))
    expect((await call('DELETE', `/children/${extra.data.id}`, 1)).status).toBe(204)
    expect((await call('GET', `/children/${extra.data.id}`, 1)).status).toBe(404)
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

it('부모 조르기 조회 응답이 계약에 맞는다', async () => {
  const child = (await call('POST', '/children', 1, toChildRequest(DEMO_CHILD))).data
  const item = await call('POST', '/wish/items', 1, { childId: child.id, optionId: 1, quantity: 2 })
  expect(item.status).toBe(201)
  expectContract((await call('GET', `/wish?childId=${child.id}`, 1)).data, wishShape)
  const request = await call('POST', '/wish/requests', 1, {
    childId: child.id,
    wishItemIds: [Number(item.data.wishItemId)],
    message: '부탁해요',
  })
  expect(request.status).toBe(201)
  expectContract(request.data, wishRequestShape)
  const waiting = await call('GET', `/wish/requests/${request.data.requestId}/timeline`, 1)
  expect(waiting.data.steps.map((step: { step: string }) => step.step)).toEqual([
    'SENT',
    'APPROVED',
  ])
  const locked = await call('POST', '/wish/items', 1, {
    childId: child.id,
    optionId: 1,
    quantity: 1,
  })
  expect(locked.data).toMatchObject({ status: 409, title: '조르는 중인 상품입니다' })
  expectContract(
    (await call('GET', `/wish/requests?childId=${child.id}`, 1)).data,
    wishRequestsShape,
  )
  expectContract(
    (await call('GET', `/wish/requests/${request.data.requestId}`, 1)).data,
    wishRequestShape,
  )
  expectContract(
    (await call('GET', `/wish/requests/${request.data.requestId}/timeline`, 1)).data,
    wishTimelineShape,
  )
  const approved = await call('POST', `/wish/requests/${request.data.requestId}/approval`, 1, {
    checkout: 'ORDER',
    items: [
      { wishItemId: Number(item.data.wishItemId), quantity: 1, unitPrice: item.data.unitPrice },
    ],
    shippingAddress: { recipientName: '부모', phone: '010', zipCode: '12345', address: '서울' },
  })
  expect(approved.status).toBe(200)
  expectContract(approved.data, wishRequestShape)
  expectContract((await call('GET', `/orders/${approved.data.orderId}`, 1)).data, orderDetailShape)
  const ordered = await call('GET', `/wish/requests/${request.data.requestId}/timeline`, 1)
  expectContract(ordered.data, wishTimelineShape)
  expect(ordered.data.steps.map((step: { step: string }) => step.step)).toEqual([
    'SENT',
    'APPROVED',
    'CREATED',
    'PAYMENT_REQUESTED',
    'PAID',
    'SHIPPED',
    'DELIVERED',
    'CONFIRMED',
  ])
  const decided = await call('POST', `/wish/requests/${request.data.requestId}/rejection`, 1, {
    reason: 'OTHER',
  })
  expect(decided.data).toMatchObject({ status: 409, title: '이미 처리한 조르기입니다' })
  const another = await call('POST', '/wish/items', 1, {
    childId: child.id,
    optionId: 2,
    quantity: 1,
  })
  const otherRequest = await call('POST', '/wish/requests', 1, {
    childId: child.id,
    wishItemIds: [Number(another.data.wishItemId)],
    message: null,
  })
  const badReason = await call(
    'POST',
    `/wish/requests/${otherRequest.data.requestId}/rejection`,
    1,
    { reason: 'NOPE' },
  )
  expect(badReason.data).toMatchObject({ status: 400, title: '잘못된 거절 사유입니다' })
  const rejected = await call(
    'POST',
    `/wish/requests/${otherRequest.data.requestId}/rejection`,
    1,
    { reason: 'OTHER' },
  )
  expect(rejected.status).toBe(200)
  expectContract(rejected.data, wishRequestShape)
  expect(rejected.data).toMatchObject({ status: 'REJECTED', rejectReason: 'OTHER' })
  const rejectedTimeline = await call(
    'GET',
    `/wish/requests/${otherRequest.data.requestId}/timeline`,
    1,
  )
  expect(rejectedTimeline.data.steps.map((step: { step: string }) => step.step)).toEqual([
    'SENT',
    'REJECTED',
  ])
  // 거절하면 모든 줄, 승인하면 고르지 않은 줄의 잠금이 풀린다
  const third = await call('POST', '/wish/items', 1, {
    childId: child.id,
    optionId: 3,
    quantity: 1,
  })
  const resent = await call('POST', '/wish/requests', 1, {
    childId: child.id,
    wishItemIds: [Number(another.data.wishItemId), Number(third.data.wishItemId)],
    message: null,
  })
  expect(resent.status).toBe(201)
  await call('POST', `/wish/requests/${resent.data.requestId}/approval`, 1, {
    checkout: 'ORDER',
    items: [
      {
        wishItemId: Number(another.data.wishItemId),
        quantity: 1,
        unitPrice: another.data.unitPrice,
      },
    ],
    shippingAddress: { recipientName: '부모', phone: '010', zipCode: '12345', address: '서울' },
  })
  const lines = (await call('GET', `/wish?childId=${child.id}`, 1)).data.items as {
    wishItemId: string
    requestId: string | null
  }[]
  expect(lines.find((line) => line.wishItemId === third.data.wishItemId)?.requestId).toBeNull()
  expect(lines.find((line) => line.wishItemId === another.data.wishItemId)?.requestId).toBe(
    resent.data.requestId,
  )
})
