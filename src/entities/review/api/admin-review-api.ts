import { apiClient, expectShape } from '@/shared/api'
import type { AdminReviewListDto } from './admin-review.dto'
import { adminReviewListShape } from './admin-review.shape'

export const adminReviewApi = {
  /** 검사 상태별 리뷰(최신순 커서, 관리자 토큰). size 1~50 */
  list: (status: string, params: { cursor?: string; size?: number }) =>
    apiClient
      .get<AdminReviewListDto>('/admin/community/reviews', { params: { status, ...params } })
      .then(expectShape(adminReviewListShape)),
}
