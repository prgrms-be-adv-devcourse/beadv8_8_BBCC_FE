import type { ReviewDraft } from '@/entities/review'
import type { WriteReviewRequestDto } from '../api/write-review.dto'

/** 검증을 통과한 초안만 넘긴다 (별점이 null이면 쓰지 않음) */
export function toWriteReviewRequest(
  orderItemId: string,
  draft: ReviewDraft,
): WriteReviewRequestDto {
  return {
    orderItemId,
    rating: draft.rating ?? 0,
    content: draft.content.trim(),
    ...(draft.fit !== null && { fit: draft.fit }),
    ...(draft.imageUrls.length > 0 && { imageUrls: draft.imageUrls }),
  }
}
