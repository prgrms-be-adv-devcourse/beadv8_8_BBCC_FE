import { toImageUrl } from '@/shared/lib'
import type { RecommendedProductDto, SizeRecommendationDto } from '../api/recommendation.dto'
import type {
  Fit,
  RecommendedProduct,
  RecommendedProductsQuery,
  SizeRange,
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

/** 맞춤 목록 조회 조건 → BE 요청 값 (카테고리가 없으면 보내지 않는다) */
export function toRecommendedProductsParams(
  query: RecommendedProductsQuery,
): RecommendedProductsParamsDto {
  return {
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    page: query.page ?? 0,
    size: query.size ?? 20,
  }
}
