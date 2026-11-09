import { reviewShape } from '@/entities/review'
import { apiClient, expectShape } from '@/shared/api'
import type { UpdateReviewRequestDto, UpdatedReviewDto } from './edit-review.dto'

export const editReviewApi = {
  /** 200. 403 남의 리뷰 · 404 없음 */
  update: (reviewId: string, request: UpdateReviewRequestDto) =>
    apiClient
      .patch<UpdatedReviewDto>(`/reviews/${reviewId}`, request)
      .then(expectShape(reviewShape)),
  /** 204 */
  remove: (reviewId: string) => apiClient.delete(`/reviews/${reviewId}`).then(() => undefined),
}
