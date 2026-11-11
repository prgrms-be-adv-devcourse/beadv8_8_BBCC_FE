import { apiClient, expectShape } from '@/shared/api'
import type {
  CompanionProductsDto,
  HomePreviewDto,
  RecommendedProductPageDto,
  RecommendedProductsParamsDto,
  SizeRecommendationDto,
} from './recommendation.dto'
import {
  companionProductsShape,
  homePreviewShape,
  recommendedProductPageShape,
  sizeRecommendationShape,
} from './recommendation.shape'
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
      .get<RecommendedProductPageDto>('/recommendations/products', {
        params: { childId, ...params },
      })
      .then(expectShape(recommendedProductPageShape)),
  /** 홈 맛보기 4개 (후보가 없으면 []). 없는 자녀 · 남의 자녀면 404 */
  getPreview: (childId: string) =>
    apiClient
      .get<HomePreviewDto>('/recommendations/products/preview', { params: { childId } })
      .then(expectShape(homePreviewShape)),
  /**
   * 함께 사면 좋은 상품 (최대 4개, 후보가 없으면 []). 없는 상품 · 자녀 · 남의 자녀면 404.
   * AI가 고르면 3초 가까이 걸려 Gateway가 504를 줄 수 있다
   */
  getCompanions: (productId: string, childId: string) =>
    apiClient
      .get<CompanionProductsDto>('/recommendations/companions', {
        params: { productId, childId },
      })
      .then(expectShape(companionProductsShape)),
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
