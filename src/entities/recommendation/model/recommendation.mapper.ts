import type { RecommendedProductDto, SizeRecommendationDto } from '../api/recommendation.dto'
import type { Fit, RecommendedProduct, SizeRecommendation } from './recommendation'

export function toSizeRecommendation(dto: SizeRecommendationDto): SizeRecommendation {
  return { recommendedSize: dto.recommendedSize, fit: dto.fit as Fit | null, reasons: dto.reasons }
}

export function toRecommendedProduct(dto: RecommendedProductDto): RecommendedProduct {
  return {
    id: dto.productId,
    name: dto.name,
    categoryName: dto.categoryName,
    sellerName: dto.sellerName,
    minPrice: dto.minPrice,
    recommendedSize: dto.recommendedSize,
    fit: dto.fit as Fit,
  }
}
