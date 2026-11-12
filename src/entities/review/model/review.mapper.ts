import { toImageUrl } from '@/shared/lib'
import type {
  ReviewableItemDto,
  ReviewDto,
  ReviewListItemDto,
  ReviewSummaryDto,
} from '../api/review.dto'
import type { Fit, Review, ReviewableItem, ReviewSummary } from './review'

const FIT_VALUES: readonly string[] = ['SMALL', 'TRUE_TO_SIZE', 'LARGE'] satisfies Fit[]

function toFit(value: string | null): Fit | null {
  return value !== null && FIT_VALUES.includes(value) ? (value as Fit) : null
}

function authorNameOf(dto: ReviewDto): string {
  if (dto.authorWithdrawn) return '탈퇴한 회원'
  return dto.nickname ?? '회원'
}

/** 작성 · 수정 응답(ReviewResponse)과 목록 항목을 같은 모델로 */
export function toReview(dto: ReviewDto | ReviewListItemDto): Review {
  const listed = 'visibility' in dto ? dto : null
  return {
    id: dto.reviewId,
    orderItemId: dto.orderItemId,
    productId: dto.productId,
    productName: listed?.productName ?? null,
    thumbnailUrl: toImageUrl(listed?.thumbnailUrl),
    rating: dto.rating,
    content: dto.content,
    authorName: authorNameOf(dto),
    fit: toFit(dto.fit),
    purchasedSize: dto.purchasedSize,
    imageUrls: dto.imageUrls,
    isUnderReview: listed?.visibility === 'UNDER_REVIEW',
    createdAt: dto.createdAt,
  }
}

export function toReviewSummary(dto: ReviewSummaryDto): ReviewSummary {
  return {
    productId: dto.productId,
    count: dto.reviewCount,
    averageRating: dto.averageRating,
    fit: {
      SMALL: dto.fitSummary.small,
      TRUE_TO_SIZE: dto.fitSummary.trueToSize,
      LARGE: dto.fitSummary.large,
    },
  }
}

export function toReviewableItem(dto: ReviewableItemDto): ReviewableItem {
  return {
    orderItemId: dto.orderItemId,
    orderId: dto.orderId,
    productId: dto.productId,
    productName: dto.productName,
    thumbnailUrl: toImageUrl(dto.thumbnailUrl),
    size: dto.size,
    confirmedAt: dto.confirmedAt,
  }
}
