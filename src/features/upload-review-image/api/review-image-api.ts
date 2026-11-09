import { apiClient, expectShape } from '@/shared/api'
import type { ReviewImageUploadDto, ReviewImageUploadRequestDto } from './review-image.dto'
import { reviewImageUploadShape } from './review-image.shape'

export const reviewImageApi = {
  /** 업로드 주소 발급. 형식 · 크기 · 장수 위반은 400 */
  issueUploadUrls: (request: ReviewImageUploadRequestDto) =>
    apiClient
      .post<ReviewImageUploadDto>('/reviews/images/upload-urls', request)
      .then(expectShape(reviewImageUploadShape)),
}
