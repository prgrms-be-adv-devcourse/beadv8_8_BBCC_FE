import { isAxiosError } from 'axios'
import type { OrderDetailDto } from '@/entities/order'
import type { ProductDetailDto } from '@/entities/product'
import type { PurchasedGarmentDto } from '@/entities/recommendation'
import type { MockHandler, MockRequest, MockResult } from '@/shared/api'
import { fetchReal, page, problem } from './mock-utils'

// 추천 기준 옷 「산 옷에서 고르기」 (BE #1168 머지 전). 실제 서버의 내 주문에서 이 자녀의 구매확정된 주문상품을 모으고,
// 상품 상세에서 이름 · 카테고리 · 산 사이즈 실측을 붙인다. 상품을 읽지 못하면 그 칸들은 null (BE와 같다)
const ORDER_PAGE_SIZE = 50
const instance = (request: MockRequest) =>
  `/api/v1/recommendations/children/${request.params.childId}/purchases`

/** 자녀를 읽어 남의 자녀면 403, 없으면 404. 읽히면 null */
async function childProblem(request: MockRequest): Promise<MockResult | null> {
  try {
    await fetchReal(request, `/children/${request.params.childId}`)
    return null
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403)
      return problem(
        403,
        '자녀에 접근할 수 없습니다',
        '로그인한 보호자의 자녀만 다룰 수 있습니다.',
        instance(request),
      )
    return problem(404, '자녀를 찾을 수 없습니다', '자녀를 다시 확인해 주세요.', instance(request))
  }
}

async function confirmedItemsOf(request: MockRequest) {
  const orders = await fetchReal<{ content: { orderId: string }[] }>(
    request,
    `/orders?page=0&size=${ORDER_PAGE_SIZE}`,
  )
  const details = await Promise.all(
    orders.content.map((order) => fetchReal<OrderDetailDto>(request, `/orders/${order.orderId}`)),
  )
  return details
    .flatMap((detail) => detail.items)
    .filter(
      (item) =>
        item.status === 'CONFIRMED' &&
        item.confirmedAt !== null &&
        item.size !== null &&
        item.child?.childId === request.params.childId,
    )
}

async function productOf(request: MockRequest, productId: string) {
  return fetchReal<ProductDetailDto>(request, `/products/${productId}`).catch(() => null)
}

export const recommendHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: '/recommendations/children/:childId/purchases',
    handle: async (request) => {
      const failed = await childProblem(request)
      if (failed) return failed
      const items = await confirmedItemsOf(request)
      const garments = await Promise.all(
        items.map(async (item): Promise<PurchasedGarmentDto> => {
          const product = await productOf(request, item.productId)
          const spec = product?.sizeSpecs.find((candidate) => candidate.size === item.size)
          return {
            orderItemId: item.orderItemId,
            productId: item.productId,
            productName: product?.name ?? null,
            categoryId: product?.categoryId ?? null,
            size: item.size ?? '',
            measurements: spec?.measurements ?? null,
            confirmedAt: item.confirmedAt ?? '',
          }
        }),
      )
      // 확정이 늦은 순서
      garments.sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt))
      return { status: 200, data: page(garments, request) }
    },
  },
]
