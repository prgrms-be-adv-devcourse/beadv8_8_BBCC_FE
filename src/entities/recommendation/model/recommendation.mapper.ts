import { toImageUrl } from '@/shared/lib'
import type { RecommendedProductDto, SizeRecommendationDto } from '../api/recommendation.dto'
import type { Fit, RecommendedProduct, SizeRecommendation } from './recommendation'

export function toSizeRecommendation(dto: SizeRecommendationDto): SizeRecommendation {
  return {
    recommendedSize: dto.recommendedSize,
    fit: dto.fit as Fit | null,
    reasons: dto.reasons,
    sizes: dto.sizes.map((item) => ({
      size: item.size,
      minHeightCm: item.minHeightCm,
      maxHeightCm: item.maxHeightCm,
      fit: item.fit as Fit | null,
    })),
  }
}

export function toRecommendedProduct(dto: RecommendedProductDto): RecommendedProduct {
  return {
    id: dto.productId,
    name: dto.name,
    categoryId: dto.categoryId,
    brand: dto.brand?.trim() || null,
    minPrice: dto.minPrice,
    imageUrl: toImageUrl(dto.thumbnailUrl),
    recommendedSize: dto.recommendedSize,
    fit: dto.fit as Fit,
  }
}
