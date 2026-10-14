import type { ChildProfile } from '@/entities/child'
import type { ProductOption } from '@/entities/product'
import type { Fit, SizeRecommendation } from '@/entities/recommendation'
import type { MockHandler, MockRequest } from '@/shared/api'
import { getErrorStatus } from '@/shared/api'
import { fetchReal, page, problem } from './mock-utils'
import { products } from './product-handlers'

const MARGIN_CM = 2

// 기획서 2.1 추천 규칙 · 적합도를 단순하게 옮긴 목 (몸무게로 체형 판정은 생략, 입력된 체형만 사용)
function fitOf(height: number, option: ProductOption): Fit {
  if (height < option.minHeightCm) return 'ROOMY'
  if (height > option.maxHeightCm) return 'TIGHT'
  const nearLow = height - option.minHeightCm <= MARGIN_CM
  const nearHigh = option.maxHeightCm - height <= MARGIN_CM
  if (nearLow && nearHigh) return 'PROPER'
  if (nearLow) return 'ROOMY'
  if (nearHigh) return 'TIGHT'
  return 'PROPER'
}

function recommend(child: ChildProfile, options: ProductOption[]) {
  const height = child.heightCm
  const candidates = options
    .filter(
      (option) =>
        height >= option.minHeightCm - MARGIN_CM && height <= option.maxHeightCm + MARGIN_CM,
    )
    .sort((a, b) => a.minHeightCm - b.minHeightCm)
  const reasons: string[] = [
    `키 ${height}cm가 권장 키 범위(±${MARGIN_CM}cm)에 드는 사이즈: ${candidates.map((option) => option.size).join(', ') || '없음'}`,
  ]
  if (candidates.length === 0) {
    reasons.push('맞는 사이즈가 없어요.')
    return { option: null, reasons }
  }
  if (candidates.length === 1) {
    return { option: candidates[0], reasons }
  }
  const smaller = candidates[0]
  const bigger = candidates[candidates.length - 1]
  if (child.bodyType === 'CHUNKY') {
    reasons.push('후보가 둘 → 체형이 통통해서 큰 사이즈')
    return { option: bigger, reasons }
  }
  if (child.bodyType === 'SLIM') {
    reasons.push('후보가 둘 → 체형이 말라서 작은 사이즈')
    return { option: smaller, reasons }
  }
  if (child.preferredFit === 'SLIM') {
    reasons.push('후보가 둘 · 체형 보통 → 선호 핏이 딱 맞게라서 작은 사이즈')
    return { option: smaller, reasons }
  }
  reasons.push(
    child.preferredFit === 'LOOSE'
      ? '후보가 둘 · 체형 보통 → 선호 핏이 여유라서 큰 사이즈'
      : '후보가 둘 · 선호 핏 없음 → 큰 사이즈',
  )
  return { option: bigger, reasons }
}

async function loadChild(request: MockRequest, childId: string): Promise<ChildProfile | null> {
  try {
    return await fetchReal<ChildProfile>(request, `/children/${childId}`)
  } catch (error) {
    if (getErrorStatus(error) === 404) return null
    throw error
  }
}

export const recommendationHandlers: MockHandler[] = [
  {
    method: 'GET',
    path: '/products/:productId/size-recommendation',
    handle: async (request) => {
      const instance = `/api/v1/products/${request.params.productId}/size-recommendation`
      const product = products.find((item) => item.productId === request.params.productId)
      const childId = request.query.get('childId') ?? ''
      const child = await loadChild(request, childId)
      if (!product || !child) {
        return problem(404, '찾을 수 없습니다', '상품 또는 자녀를 찾을 수 없습니다.', instance)
      }
      const { option, reasons } = recommend(child, product.options)
      const data: SizeRecommendation = {
        productId: product.productId,
        childId,
        recommendedSize: option?.size ?? null,
        fit: option ? fitOf(child.heightCm, option) : null,
        reasons,
        sizes: product.options.map((item) => {
          const inRange =
            child.heightCm >= item.minHeightCm - MARGIN_CM &&
            child.heightCm <= item.maxHeightCm + MARGIN_CM
          return {
            size: item.size,
            minHeightCm: item.minHeightCm,
            maxHeightCm: item.maxHeightCm,
            fit: inRange ? fitOf(child.heightCm, item) : null,
          }
        }),
      }
      return { status: 200, data }
    },
  },
  {
    method: 'GET',
    path: '/children/:childId/recommended-products',
    handle: async (request) => {
      const child = await loadChild(request, request.params.childId)
      if (!child) {
        return problem(
          404,
          '찾을 수 없습니다',
          '자녀를 찾을 수 없습니다.',
          `/api/v1/children/${request.params.childId}/recommended-products`,
        )
      }
      const content = products
        .filter((product) => product.status === 'ON_SALE')
        .flatMap((product) => {
          const { option } = recommend(
            child,
            product.options.filter((item) => !item.soldOut),
          )
          return option
            ? [
                {
                  productId: product.productId,
                  name: product.name,
                  categoryName: product.categoryName,
                  sellerName: product.sellerName,
                  minPrice: product.minPrice,
                  thumbnailUrl: product.thumbnailUrl,
                  recommendedSize: option.size,
                  fit: fitOf(child.heightCm, option),
                },
              ]
            : []
        })
      return { status: 200, data: page(content, request) }
    },
  },
]
