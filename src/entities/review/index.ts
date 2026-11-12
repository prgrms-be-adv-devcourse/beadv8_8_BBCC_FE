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
