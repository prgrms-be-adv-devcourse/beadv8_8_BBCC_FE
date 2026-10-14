import { apiClient, expectShape, type Page } from '@/shared/api'
import type { RecommendedProductDto, SizeRecommendationDto } from './recommendation.dto'
import { recommendedProductPageShape, sizeRecommendationShape } from './recommendation.shape'

export const recommendationApi = {
  getSize: (productId: string, childId: string) =>
    apiClient
      .get<SizeRecommendationDto>(`/products/${productId}/size-recommendation`, {
        params: { childId },
      })
      .then(expectShape(sizeRecommendationShape)),
  getProducts: (childId: string) =>
    apiClient
      .get<Page<RecommendedProductDto>>(`/children/${childId}/recommended-products`, {
        params: { page: 0, size: 20 },
      })
      .then(expectShape(recommendedProductPageShape)),
}
