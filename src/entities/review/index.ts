export type {
  Fit,
  FitCounts,
  Review,
  ReviewAction,
  ReviewableItem,
  ReviewDraft,
  ReviewDraftErrors,
  ReviewSummary,
} from './model/review'
export { toReview, toReviewableItem, toReviewSummary } from './model/review.mapper'
export type {
  AdminReview,
  ModerationAction,
  ModerationReason,
  ModerationStatus,
} from './model/admin-review'
export { toAdminReview } from './model/admin-review.mapper'
export {
  ADMIN_REVIEW_STATUSES,
  MODERATION_ACTION_LABEL,
  MODERATION_REASON_LABEL,
  MODERATION_STATUS_LABEL,
  moderationActionsOf,
  moderationStatusOf,
} from './model/admin-review.rules'
export {
  averageRatingLabel,
  canChooseFit,
  draftOf,
  EMPTY_REVIEW_DRAFT,
  FIT_LABEL,
  FITS,
  fitShares,
  hasDraftErrors,
  REVIEW_CONTENT_MAX,
  REVIEW_IMAGE_MAX_COUNT,
  REVIEW_RATING_MAX,
  reviewActionOf,
  reviewSaveErrorMessage,
  validateReviewDraft,
} from './model/review.rules'
export {
  reviewKeys,
  useAdminReviewsQuery,
  useMyReviewsQuery,
  useProductReviewsQuery,
  useReviewableItemQuery,
  useReviewableItemsQuery,
  useReviewSummaryQuery,
} from './model/queries'
export { reviewShape } from './api/review.shape'
export { ReviewCard } from './ui/ReviewCard'
export { ReviewForm } from './ui/ReviewForm'
export { ReviewStars } from './ui/ReviewStars'
export { ReviewSummaryCard } from './ui/ReviewSummaryCard'

// 목 응답 · 가짜 백엔드 계약 작성 전용
export type {
  ReviewDto as MockReviewDto,
  ReviewListItemDto as MockReviewListItemDto,
} from './api/review.dto'
