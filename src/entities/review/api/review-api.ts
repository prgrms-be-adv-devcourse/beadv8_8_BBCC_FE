import { apiClient, expectShape } from '@/shared/api'
import type {
  CursorPageDto,
  ReviewableItemDto,
  ReviewListItemDto,
  ReviewSummaryDto,
} from './review.dto'
import { reviewableItemsShape, reviewListShape, reviewSummaryShape } from './review.shape'

/** 커서 목록 요청 값. cursor는 직전 응답의 nextCursor (처음이면 뺀다), size는 1~50 */
type CursorParams = { cursor?: string; size?: number }

export const reviewApi = {
  /** 상품 리뷰(공개, 최신순) */
  byProduct: (productId: string, params: CursorParams) =>
    apiClient
      .get<CursorPageDto<ReviewListItemDto>>('/reviews', { params: { productId, ...params } })
      .then(expectShape(reviewListShape)),
  /** 내 리뷰(최신순, 검토 중 포함) */
  mine: (params: CursorParams) =>
    apiClient
      .get<CursorPageDto<ReviewListItemDto>>('/reviews/me', { params })
      .then(expectShape(reviewListShape)),
  /** 리뷰 수 · 평균 별점 · 핏 분포(공개) */
  summary: (productId: string) =>
    apiClient
      .get<ReviewSummaryDto>('/reviews/summary', { params: { productId } })
      .then(expectShape(reviewSummaryShape)),
  /** 리뷰를 쓸 수 있는 내 주문상품(구매확정 최신순) */
  reviewable: (params: CursorParams) =>
    apiClient
      .get<CursorPageDto<ReviewableItemDto>>('/reviews/eligible', { params })
      .then(expectShape(reviewableItemsShape)),
}
