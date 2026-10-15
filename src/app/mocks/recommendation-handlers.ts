import type { ChildProfileDto } from '@/entities/child'
import { type ProductDetailDto, toProductDetail } from '@/entities/product'
import type { RecommendedProductDto } from '@/entities/recommendation'
import type { MockHandler, MockRequest } from '@/shared/api'
import { getErrorStatus } from '@/shared/api'
import { fetchReal, page, problem } from './mock-utils'
import { loadOnSaleDetails } from './product-handlers'

/** 추천에 쓰는 사이즈 줄: 실제 상세의 옵션 + 실측 권장 키 (권장 키가 없는 옵션은 뺀다) */
type SizeOption = {
  size: string
  minHeightCm: number
  maxHeightCm: number
  soldOut: boolean
}

function sizeOptionsOf(detail: ProductDetailDto): SizeOption[] {
  const rows = toProductDetail(detail).options.flatMap((option) =>
    option.size !== null && option.minHeightCm !== null && option.maxHeightCm !== null
      ? [
          {
            size: option.size,
            minHeightCm: option.minHeightCm,
            maxHeightCm: option.maxHeightCm,
            soldOut: option.soldOut,
          },
        ]
      : [],
  )
  // 색상만 다른 같은 사이즈는 한 줄로 (하나라도 살 수 있으면 살 수 있음)
  const bySize = new Map<string, SizeOption>()
  for (const row of rows) {
    const previous = bySize.get(row.size)
    bySize.set(row.size, previous ? { ...previous, soldOut: previous.soldOut && row.soldOut } : row)
  }
  return [...bySize.values()]
}

const MARGIN_CM = 2

// 기획서 2.1 추천 규칙을 단순하게 옮긴 목 (몸무게로 체형 판정은 생략, 입력된 체형만 사용)
function recommend(child: ChildProfileDto, options: SizeOption[]) {
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

async function loadChild(request: MockRequest, childId: string): Promise<ChildProfileDto | null> {
  try {
    return await fetchReal<ChildProfileDto>(request, `/children/${childId}`)
  } catch (error) {
    if (getErrorStatus(error) === 404) return null
    throw error
  }
}

// 사이즈 추천은 실제 API(BE #262). 자녀 맞춤 목록만 목으로 남는다
export const recommendationHandlers: MockHandler[] = [
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
      const content: RecommendedProductDto[] = (await loadOnSaleDetails(request)).flatMap(
        (product) => {
          const { option } = recommend(
            child,
            sizeOptionsOf(product).filter((item) => !item.soldOut),
          )
          return option
            ? [
                {
                  productId: product.productId,
                  name: product.name,
                  thumbnailUrl: product.imageUrls[0] ?? null,
                  businessName: null,
                  minPrice: product.minPrice,
                  recommendedSize: option.size,
                },
              ]
            : []
        },
      )
      return { status: 200, data: page(content, request) }
    },
  },
]
