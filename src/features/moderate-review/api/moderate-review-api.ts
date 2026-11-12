import { apiClient, expectShape } from '@/shared/api'
import type { ReviewVisibilityDto, ReviewVisibilityRequestDto } from './moderate-review.dto'
import { reviewVisibilityShape } from './moderate-review.shape'

export const moderateReviewApi = {
  /** 400 INVALID_VISIBILITY · 404 REVIEW_NOT_FOUND */
  changeVisibility: (reviewId: string, request: ReviewVisibilityRequestDto) =>
    apiClient
      .patch<ReviewVisibilityDto>(`/admin/community/reviews/${reviewId}/visibility`, request)
      .then(expectShape(reviewVisibilityShape)),
}
