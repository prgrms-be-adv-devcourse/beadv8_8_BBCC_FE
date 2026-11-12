import type { AdminReviewDto } from '../api/admin-review.dto'
import type { AdminReview, ModerationReason } from './admin-review'
import { isModerationStatus, MODERATION_REASON_LABEL } from './admin-review.rules'

function toReason(value: string | null): ModerationReason | null {
  if (value === null) return null
  return value in MODERATION_REASON_LABEL ? (value as ModerationReason) : 'OTHER'
}

export function toAdminReview(dto: AdminReviewDto): AdminReview {
  return {
    id: dto.reviewId,
    productId: dto.productId,
    // 모르는 상태는 숨기지 않은 것(검사 대기)으로 본다. 조치 버튼은 숨김 확정만 보인다
    status: isModerationStatus(dto.status) ? dto.status : 'PENDING',
    reason: toReason(dto.reason),
    moderatedAt: dto.moderatedAt,
    attempts: dto.attempts,
    isAttemptsExhausted: dto.attemptsExhausted,
    content: dto.content,
    imageUrls: dto.imageUrls,
    createdAt: dto.createdAt,
  }
}
