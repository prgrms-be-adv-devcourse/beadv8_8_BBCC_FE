import { apiClient, expectShape, getEventStream, type Page } from '@/shared/api'
import type { PurchasedGarmentDto } from './purchased-garment.dto'
import { purchasedGarmentPageShape } from './purchased-garment.shape'
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
  /**
   * 홈 맛보기 4개 (SSE): 규칙 결과(rule)가 먼저 오고 AI 답(ai)이 오면 닫힌다. 후보가 없으면 products는 [].
   * 없는 자녀 · 남의 자녀면 스트림을 열기 전에 404
   */
  streamPreview: (childId: string, signal?: AbortSignal) =>
    getEventStream<HomePreviewDto>('/recommendations/products/preview', {
      params: { childId },
      signal,
      shape: homePreviewShape,
    }),
  /**
   * 함께 사면 좋은 상품 4개까지 (SSE, 맛보기와 같은 순서). 없는 상품 · 자녀 · 남의 자녀면 스트림을 열기 전에 404
   */
  streamCompanions: (productId: string, childId: string, signal?: AbortSignal) =>
    getEventStream<CompanionProductsDto>('/recommendations/companions', {
      params: { productId, childId },
      signal,
      shape: companionProductsShape,
    }),
  /** 자녀의 기준 옷 (상의 → 하의, 없으면 []). 남의 자녀면 403, 없는 자녀면 404 */
  referenceGarments: (childId: string) =>
    apiClient
      .get<ReferenceGarmentDto[]>(referenceGarments(childId))
      .then(expectShape(referenceGarmentListShape)),
  /**
   * 기준 옷 저장 (처음이든 교체든 같은 응답). part는 TOP · BOTTOM · OUTER · DRESS · SKIRT만, 구분 · 카테고리 · 실측이 맞지 않으면 400.
   * 같은 자녀 · 구분의 첫 저장이 동시에 오면 하나가 409 (다시 보내면 교체)
   */
  saveReferenceGarment: (childId: string, part: string, request: ReferenceGarmentRequestDto) =>
    apiClient
      .put<ReferenceGarmentDto>(`${referenceGarments(childId)}/${part}`, request)
      .then(expectShape(referenceGarmentShape)),
  /** 자녀에게 산 옷 중 구매확정된 것 (확정이 늦은 순서, size 1 ~ 100). 남의 자녀면 403, 없는 자녀면 404 */
  purchasedGarments: (childId: string, params: { page: number; size: number }) =>
    apiClient
      .get<Page<PurchasedGarmentDto>>(`/recommendations/children/${childId}/purchases`, { params })
      .then(expectShape(purchasedGarmentPageShape)),
  /** 기준 옷 지우기 (204, 이미 없어도 204) */
  deleteReferenceGarment: (childId: string, part: string) =>
    apiClient.delete<void>(`${referenceGarments(childId)}/${part}`).then(() => undefined),
}
