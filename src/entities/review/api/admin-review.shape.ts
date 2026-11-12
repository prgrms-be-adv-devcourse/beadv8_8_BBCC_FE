import { arr, bool, nullable, num, obj, str } from '@/shared/api'

export const adminReviewListShape = obj({
  items: arr(
    obj({
      reviewId: str,
      productId: str,
      status: str,
      reason: nullable(str),
      moderatedAt: nullable(str),
      attempts: num,
      attemptsExhausted: bool,
      content: str,
      imageUrls: arr(str),
      createdAt: str,
    }),
  ),
  nextCursor: nullable(str),
})
