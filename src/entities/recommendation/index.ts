/** 목 응답 작성 전용 (app/mocks) */
export type { RecommendedProductDto, SizeRecommendationDto } from './api/recommendation.dto'
export {
  FIT_LABEL,
  type Fit,
  type RecommendedProduct,
  type SizeRecommendation,
} from './model/recommendation'
export {
  recommendationKeys,
  useRecommendedProductsQuery,
  useSizeRecommendationQuery,
} from './model/queries'
export { FitBadge } from './ui/FitBadge'
export { SizeRecommendationSummary } from './ui/SizeRecommendationSummary'
