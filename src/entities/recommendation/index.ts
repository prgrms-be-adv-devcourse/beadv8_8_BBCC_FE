export { recommendationApi } from './api/recommendation-api'
/** 목 응답 작성 전용 (app/mocks) */
export type { RecommendedProductDto, SizeRecommendationDto } from './api/recommendation.dto'
export type { ReferenceGarmentDto, ReferenceGarmentRequestDto } from './api/reference-garment.dto'
export {
  type Fit,
  type RecommendationSource,
  type RecommendedPick,
  type RecommendedPicks,
  type RecommendedProduct,
  type RecommendedProductsQuery,
  type SizeNotice,
  type SizeRange,
  type SizeRecommendation,
} from './model/recommendation'
export {
  sizeRangesOf,
  toCompanionProducts,
  toRecommendedProduct,
  toRecommendedProductsParams,
  toSizeRecommendation,
} from './model/recommendation.mapper'
export {
  recommendationKeys,
  useCompanionProductsQuery,
  useRecommendedProductsInfiniteQuery,
  useRecommendedProductsQuery,
  useReferenceGarmentsQuery,
  useSizeRecommendationQuery,
} from './model/queries'
export { sizeScaleOf, type SizeScale } from './model/size-scale.rules'
export { nextRecommendedPageOf } from './model/recommended-page.rules'
export { FIT_LABEL } from './model/recommendation'
export { FitBadge } from './ui/FitBadge'
export { SizeRecommendationSummary } from './ui/SizeRecommendationSummary'
export {
  GARMENT_PART_SPEC,
  GARMENT_PARTS,
  MEASUREMENT_LABEL,
  type GarmentPart,
  type ReferenceGarment,
  type ReferenceGarmentForm,
  type ReferenceGarmentMeasurement,
} from './model/reference-garment'
export {
  toReferenceGarment,
  toReferenceGarmentForm,
  toReferenceGarmentFromPurchase,
  type PurchasedGarment,
  toReferenceGarmentRequest,
} from './model/reference-garment.mapper'
export {
  categoriesForPart,
  garmentPartOf,
  isValidMeasurementText,
  measurementCodesOf,
  validateReferenceGarmentForm,
} from './model/reference-garment.rules'
