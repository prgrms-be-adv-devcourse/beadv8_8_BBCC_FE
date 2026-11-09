import type { Review, ReviewDraft } from '@/entities/review'
import type { UpdateReviewRequestDto } from '../api/edit-review.dto'

const sameList = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index])

/** 바뀐 키만 담는다. 바뀐 것이 없으면 null (보내지 않는다) */
export function toUpdateReviewRequest(
  original: Pick<Review, 'rating' | 'fit' | 'content' | 'imageUrls'>,
  draft: ReviewDraft,
): UpdateReviewRequestDto | null {
  const content = draft.content.trim()
  const request: UpdateReviewRequestDto = {
    ...(draft.rating !== null && draft.rating !== original.rating && { rating: draft.rating }),
    ...(content !== original.content.trim() && { content }),
    ...(draft.fit !== original.fit && { fit: draft.fit }),
    ...(!sameList(draft.imageUrls, original.imageUrls) && { imageUrls: draft.imageUrls }),
  }
  return Object.keys(request).length > 0 ? request : null
}
