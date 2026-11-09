import { reviewShape } from '@/entities/review'
import { apiClient, expectShape } from '@/shared/api'
import type { WriteReviewRequestDto, WrittenReviewDto } from './write-review.dto'

export const writeReviewApi = {
  /** 201. 400 입력 오류 · 403 자격 없음 · 409 이미 씀 */
  write: (request: WriteReviewRequestDto) =>
    apiClient.post<WrittenReviewDto>('/reviews', request).then(expectShape(reviewShape)),
}
