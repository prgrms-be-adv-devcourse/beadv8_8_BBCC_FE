import { apiClient, expectShape, type Page } from '@/shared/api'
import type {
  RecommendedProductDto,
  RecommendedProductsParamsDto,
  SizeRecommendationDto,
} from './recommendation.dto'
import { recommendedProductPageShape, sizeRecommendationShape } from './recommendation.shape'
import type { ReferenceGarmentDto, ReferenceGarmentRequestDto } from './reference-garment.dto'
import { referenceGarmentListShape, referenceGarmentShape } from './reference-garment.shape'

const referenceGarments = (childId: string) =>
  `/recommendations/children/${childId}/reference-garments`

export const recommendationApi = {
  getSize: (productId: string, childId: string) =>
    apiClient
      .get<SizeRecommendationDto>('/recommendations/size', {
        params: { productId, childId },
      })
      .then(expectShape(sizeRecommendationShape)),
  getProducts: (childId: string, params: RecommendedProductsParamsDto) =>
    apiClient
      .get<Page<RecommendedProductDto>>('/recommendations/products', {
        params: { childId, ...params },
      })
      .then(expectShape(recommendedProductPageShape)),
  /** 자녀의 기준 옷 (상의 → 하의, 없으면 []). 남의 자녀면 403, 없는 자녀면 404 */
  referenceGarments: (childId: string) =>
    apiClient
      .get<ReferenceGarmentDto[]>(referenceGarments(childId))
      .then(expectShape(referenceGarmentListShape)),
  /**
   * 기준 옷 저장 (처음이든 교체든 같은 응답). part는 TOP · BOTTOM만, 구분 · 카테고리 · 실측이 맞지 않으면 400.
   * 같은 자녀 · 구분의 첫 저장이 동시에 오면 하나가 409 (다시 보내면 교체)
   */
  saveReferenceGarment: (childId: string, part: string, request: ReferenceGarmentRequestDto) =>
    apiClient
      .put<ReferenceGarmentDto>(`${referenceGarments(childId)}/${part}`, request)
      .then(expectShape(referenceGarmentShape)),
  /** 기준 옷 지우기 (204, 이미 없어도 204) */
  deleteReferenceGarment: (childId: string, part: string) =>
    apiClient.delete<void>(`${referenceGarments(childId)}/${part}`).then(() => undefined),
}
