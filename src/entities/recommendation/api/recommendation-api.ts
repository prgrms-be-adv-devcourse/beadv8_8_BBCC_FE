import { apiClient, type Page } from '@/shared/api'
import type { RecommendedProductDto, SizeRecommendationDto } from './recommendation.dto'

export const recommendationApi = {
  getSize: (productId: string, childId: string) =>
    apiClient
      .get<SizeRecommendationDto>(`/products/${productId}/size-recommendation`, {
        params: { childId },
      })
      .then((response) => response.data),
  getProducts: (childId: string) =>
    apiClient
      .get<Page<RecommendedProductDto>>(`/children/${childId}/recommended-products`, {
        params: { page: 0, size: 20 },
      })
      .then((response) => response.data),
}
