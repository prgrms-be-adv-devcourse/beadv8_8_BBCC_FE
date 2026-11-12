import { apiClient, expectShape } from '@/shared/api'
import type { RetryExhaustedDto } from './retry-review-moderation.dto'
import { retryExhaustedShape } from './retry-review-moderation.shape'

export const retryReviewModerationApi = {
  /** 자동 검사 상한에 걸린 검사 대기 리뷰를 다시 검사 대기로 (관리자 토큰). 다시 불러도 안전, 두 번째는 0 */
  retryExhausted: () =>
    apiClient
      .post<RetryExhaustedDto>('/admin/community/reviews/moderation/retry-exhausted')
      .then(expectShape(retryExhaustedShape)),
}
