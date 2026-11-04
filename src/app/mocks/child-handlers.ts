import { childApi, ageOf } from '@/entities/child'
import type { MockHandler, MockRequest } from '@/shared/api'
import { fetchReal, loadMockState, memberIdOf, now, problem, saveMockState } from './mock-utils'

type Line = {
  wishItemId: string
  childId: string
  optionId: string
  productId: string
  sellerId: null
  productName: string
  optionName: string
  size: string | null
  sellerName: string | null
  quantity: number
  unitPrice: number
  purchasable: boolean
  lineAmount: number
  addedBy: 'CHILD' | 'PARENT'
  addedAt: string
  saleStatus: string
  requestId: string | null
}
const keyOf = (request: MockRequest) => memberIdOf(request) ?? ''
const CARTS_KEY = 'child-wish-carts'
const NEXT_ID_KEY = 'child-wish-next-id'
const ITEMS_PATH = '/api/v1/child/wish/items'
function cartOf(request: MockRequest): Line[] {
  return loadMockState<Record<string, Line[]>>(CARTS_KEY, {})[keyOf(request)] ?? []
}
function saveCart(request: MockRequest, items: Line[]) {
  const carts = loadMockState<Record<string, Line[]>>(CARTS_KEY, {})
  carts[keyOf(request)] = items
  saveMockState(CARTS_KEY, carts)
}
function nextId(): string {
  const id = loadMockState(NEXT_ID_KEY, 1)
  saveMockState(NEXT_ID_KEY, id + 1)
  return String(id)
}
type Product = {
  productId: string
  name: string
  businessName: string | null
  status: string
  optionAttributes: { code: string; values: { valueId: string; value: string }[] }[]
  options: {
    optionId: string
    optionName: string
    valueIds: string[]
    price: number
    purchasable: boolean
  }[]
}
const lockedLine = () =>
  problem(
    409,
    '조르는 중인 상품입니다',
    '진행 중인 조르기에 든 상품은 다른 조르기에 넣거나 수량을 바꾸거나 뺄 수 없습니다.',
    ITEMS_PATH,
  )
async function findOption(request: MockRequest, id: string) {
  let page = 0
  for (;;) {
    const list = await fetchReal<{ content: { productId: string }[]; totalPages: number }>(
      request,
      `/products?page=${page}&size=50`,
    )
    for (const item of list.content) {
      const product = await fetchReal<Product>(request, `/products/${item.productId}`)
      const option = product.options.find((value) => value.optionId === id)
      if (option) return { product, option }
    }
    if (++page >= list.totalPages) return null
  }
}

type Status = {
  ageGroup: 'UNDER_14' | 'OVER_14'
  noticeConfirmed: boolean
  consented: boolean
  hasProfile: boolean
}
const ONBOARDING_KEY = 'child-onboarding'
async function statusOf(request: MockRequest): Promise<Status> {
  const current = loadMockState<Record<string, Status>>(ONBOARDING_KEY, {})[keyOf(request)]
  if (current) return current
  const profile = await childApi.own()
  return {
    ageGroup: ageOf(profile.birthDate) < 14 ? 'UNDER_14' : 'OVER_14',
    noticeConfirmed: false,
    consented: false,
    hasProfile: true,
  }
}
async function updateStatus(request: MockRequest, change: Partial<Status>) {
  const states = loadMockState<Record<string, Status>>(ONBOARDING_KEY, {})
  states[keyOf(request)] = { ...(await statusOf(request)), ...change }
  saveMockState(ONBOARDING_KEY, states)
}
// 가정 계약 (childprofile 확정 전)
export const childWishHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: '/child/wish',
    handle: async (request) => {
      const profile = await childApi.own()
      const items = cartOf(request)
      return {
        status: 200,
        data: {
          childId: String(profile.id),
          items,
          totalAmount: items.reduce((sum, item) => sum + item.lineAmount, 0),
        },
      }
    },
  },
  {
    method: 'POST',
    path: '/child/wish/items',
    handle: async (request) => {
      const body = request.body as { optionId: number; quantity: number }
      const isBadQuantity = (quantity: number) =>
        !Number.isInteger(quantity) || quantity < 1 || quantity > 99
      const invalidQuantity = () =>
        problem(400, '잘못된 수량입니다', '수량은 1 이상 99 이하여야 합니다.', ITEMS_PATH)
      if (isBadQuantity(body.quantity)) return invalidQuantity()
      const profile = await childApi.own()
      const items = cartOf(request)
      const existing = items.find((item) => item.optionId === String(body.optionId))
      if (existing) {
        if (existing.requestId) return lockedLine()
        if (isBadQuantity(existing.quantity + body.quantity)) return invalidQuantity()
        existing.quantity += body.quantity
        existing.lineAmount = existing.quantity * existing.unitPrice
        saveCart(request, items)
        return { status: 200, data: existing }
      }
      const found = await findOption(request, String(body.optionId))
      if (!found)
        return problem(
          404,
          '상품 옵션을 찾을 수 없습니다',
          '없는 상품 옵션입니다. 상품 화면에서 옵션을 다시 골라 주세요.',
          ITEMS_PATH,
        )
      const { product, option } = found
      const item: Line = {
        wishItemId: nextId(),
        childId: String(profile.id),
        optionId: String(body.optionId),
        productId: product.productId,
        sellerId: null,
        productName: product.name,
        optionName: option.optionName,
        size:
          product.optionAttributes
            .find((attribute) => attribute.code === 'SIZE')
            ?.values.find((value) => option.valueIds.includes(value.valueId))?.value ?? null,
        sellerName: product.businessName,
        quantity: body.quantity,
        unitPrice: option.price,
        purchasable: option.purchasable,
        lineAmount: option.price * body.quantity,
        addedBy: 'CHILD',
        addedAt: now(),
        saleStatus: product.status,
        requestId: null,
      }
      items.push(item)
      saveCart(request, items)
      return { status: 201, data: item }
    },
  },
  {
    method: 'DELETE',
    path: '/child/wish/items/:wishItemId',
    handle: (request) => {
      const items = cartOf(request)
      const index = items.findIndex((item) => item.wishItemId === request.params.wishItemId)
      if (index < 0)
        return problem(
          404,
          '조르기 상품을 찾을 수 없습니다',
          '이미 조르기에서 빠진 상품입니다. 목록을 새로고침해 주세요.',
          ITEMS_PATH,
        )
      if (items[index].addedBy !== 'CHILD')
        return problem(
          403,
          '이 상품은 뺄 수 없습니다',
          '다른 사람이 담은 상품은 뺄 수 없습니다.',
          ITEMS_PATH,
        )
      if (items[index].requestId) return lockedLine()
      items.splice(index, 1)
      saveCart(request, items)
      return { status: 204 }
    },
  },
]

export const childHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: '/child/onboarding',
    handle: async (request) => ({ status: 200, data: await statusOf(request) }),
  },
  {
    method: 'POST',
    path: '/child/onboarding/notice',
    handle: async (request) => {
      await updateStatus(request, { noticeConfirmed: true })
      return { status: 204 }
    },
  },
  {
    method: 'POST',
    path: '/child/consents',
    handle: async (request) => {
      const status = await statusOf(request)
      const body = request.body as { heightCm: number | null; weightKg: number | null }
      if (!status.hasProfile && (!body.heightCm || !body.weightKg))
        return problem(400, '잘못된 요청', '키와 몸무게를 입력해 주세요.', '/api/v1/child/consents')
      await updateStatus(request, { consented: true })
      return { status: 204 }
    },
  },
]
