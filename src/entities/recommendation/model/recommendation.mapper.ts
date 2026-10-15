import { toImageUrl } from '@/shared/lib'
import type { RecommendedProductDto, SizeRecommendationDto } from '../api/recommendation.dto'
import type { Fit, RecommendedProduct, SizeRange, SizeRecommendation } from './recommendation'

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
