import type { AdminReviewDto } from '../api/admin-review.dto'
import type { AdminReview, ModerationReason } from './admin-review'
import {
  ADMIN_REVIEW_STATUSES,
  MODERATION_REASON_LABEL,
  moderationStatusOf,
} from './admin-review.rules'

function toReason(value: string | null): ModerationReason | null {
  if (value === null) return null
  return value in MODERATION_REASON_LABEL ? (value as ModerationReason) : 'OTHER'
}

export function toAdminReview(dto: AdminReviewDto): AdminReview {
  return {
    id: dto.reviewId,
    productId: dto.productId,
    status: ADMIN_REVIEW_STATUSES.includes(dto.status as never)
      ? moderationStatusOf(dto.status)
      : 'PENDING',
    reason: toReason(dto.reason),
    moderatedAt: dto.moderatedAt,
    attempts: dto.attempts,
    isAttemptsExhausted: dto.attemptsExhausted,
    content: dto.content,
    imageUrls: dto.imageUrls,
    createdAt: dto.createdAt,
  }
}
