import { apiClient, expectShape } from '@/shared/api'
import type {
  RecommendedProductPageDto,
  RecommendedProductsParamsDto,
  SizeRecommendationDto,
} from './recommendation.dto'
import { recommendedProductPageShape, sizeRecommendationShape } from './recommendation.shape'

export const recommendationApi = {
  getSize: (productId: string, childId: string) =>
    apiClient
      .get<SizeRecommendationDto>('/recommendations/size', {
        params: { productId, childId },
      })
      .then(expectShape(sizeRecommendationShape)),
  getProducts: (childId: string, params: RecommendedProductsParamsDto) =>
    apiClient
      .get<RecommendedProductPageDto>('/recommendations/products', {
        params: { childId, ...params },
      })
      .then(expectShape(recommendedProductPageShape)),
}
