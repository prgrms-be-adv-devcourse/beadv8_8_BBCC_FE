import { toImageUrl } from '@/shared/lib'
import type {
  CompanionProductsDto,
  HomePreviewDto,
  RecommendedPickDto,
  RecommendedProductDto,
  SizeRecommendationDto,
} from '../api/recommendation.dto'
import type {
  Fit,
  RecommendedPick,
  RecommendedPicks,
  RecommendedProduct,
  RecommendedProductsQuery,
  SizeRange,
  SizeReasonType,
  SizeRecommendation,
} from './recommendation'
import type { RecommendedProductsParamsDto } from '../api/recommendation.dto'

export function toSizeRecommendation(dto: SizeRecommendationDto): SizeRecommendation {
  return {
    recommendedSize: dto.recommendedSize,
    fit: dto.fit as Fit | null,
    notices: dto.notices,
    candidateSizes: dto.candidateSizes,
    lastPurchasedSize: dto.lastPurchasedSize,
    source: dto.source,
    reasons: dto.reasons.map(({ type, detail }) => ({ type: type as SizeReasonType, detail })),
  }
}

/** 그래프용 사이즈별 권장 키: 상품 상세 실측 중 권장 키가 있는 것만 */
export function sizeRangesOf(
  specs: { size: string; minHeightCm: number | null; maxHeightCm: number | null }[],
): SizeRange[] {
  return specs.flatMap((spec) =>
    spec.minHeightCm !== null && spec.maxHeightCm !== null
      ? [{ size: spec.size, minHeightCm: spec.minHeightCm, maxHeightCm: spec.maxHeightCm }]
      : [],
  )
}

export function toRecommendedProduct(dto: RecommendedProductDto): RecommendedProduct {
  return {
    id: dto.productId,
    name: dto.name,
    businessName: dto.businessName?.trim() || null,
    minPrice: dto.minPrice,
    imageUrl: toImageUrl(dto.thumbnailUrl),
    recommendedSize: dto.recommendedSize,
  }
}

function toRecommendedPick(dto: RecommendedPickDto): RecommendedPick {
  return { ...toRecommendedProduct(dto), reason: dto.reason?.trim() || null }
}

/** 함께 사면 좋은 상품: 이유가 비었으면 null (화면이 이유 칸을 숨긴다) */
export function toCompanionProducts(dto: CompanionProductsDto): RecommendedPicks {
  return { source: dto.source, products: dto.products.map(toRecommendedPick) }
}

/** 홈 맛보기: AI여도 이유가 없는 카드는 null (화면이 이유 칸을 숨긴다) */
export function toHomePreview(dto: HomePreviewDto): RecommendedPicks {
  return { source: dto.source, products: dto.products.map(toRecommendedPick) }
}

/** 맞춤 목록 조회 조건 → BE 요청 값 (카테고리 · 기준 시각이 없으면 보내지 않는다) */
export function toRecommendedProductsParams(
  query: RecommendedProductsQuery,
): RecommendedProductsParamsDto {
  return {
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    page: query.page ?? 0,
    size: query.size ?? 20,
    ...(query.asOf ? { asOf: query.asOf } : {}),
  }
}
