/** 목 응답 작성 전용 (app/mocks) */
export type { RecommendedProductDto, SizeRecommendationDto } from './api/recommendation.dto'
export { type Fit, type RecommendedProduct, type SizeRecommendation } from './model/recommendation'
export { toRecommendedProduct } from './model/recommendation.mapper'
export { useRecommendedProductsQuery, useSizeRecommendationQuery } from './model/queries'
export { FitBadge } from './ui/FitBadge'
export { SizeRecommendationSummary } from './ui/SizeRecommendationSummary'
