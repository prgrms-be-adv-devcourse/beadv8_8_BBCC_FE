export { recommendationApi } from './api/recommendation-api'
/** 목 응답 작성 전용 (app/mocks) */
export type {
  CompanionProductsDto,
  RecommendedProductDto,
  SizeRecommendationDto,
} from './api/recommendation.dto'
export type { ReferenceGarmentDto, ReferenceGarmentRequestDto } from './api/reference-garment.dto'
export type { PurchasedGarmentDto } from './api/purchased-garment.dto'
export {
  type Fit,
  type RecommendationSource,
  type RecommendedPick,
  type RecommendedPicks,
  type RecommendedProduct,
  type RecommendedProductsQuery,
  type SizeNotice,
  type SizeRange,
  type SizeReason,
  type SizeReasonType,
  type SizeRecommendation,
} from './model/recommendation'
export {
  sizeRangesOf,
  toCompanionProducts,
  toHomePreview,
  toRecommendedProduct,
  toRecommendedProductsParams,
  toSizeRecommendation,
} from './model/recommendation.mapper'
export {
  recommendationKeys,
  useCompanionProductsQuery,
  useHomePreviewQuery,
  usePurchasedGarmentsInfiniteQuery,
  useRecommendedProductsInfiniteQuery,
  useRecommendedProductsQuery,
  useReferenceGarmentsQuery,
  useSizeRecommendationQuery,
} from './model/queries'
export { candidateNoteOf, showsAiSizeNotice } from './model/size-recommendation.rules'
export { type ItemJudgement, type ReferenceFit, type ReferenceFitItem } from './model/reference-fit'
export { referenceFitSummaryOf, type ReferenceFitSummary } from './model/reference-fit.rules'
export { hasAiReasons, shownPicksOf } from './model/recommended-picks.rules'
export { sizeScaleOf, type SizeScale } from './model/size-scale.rules'
export { nextRecommendedPageOf } from './model/recommended-page.rules'
export { FIT_LABEL, SIZE_REASON_LABEL } from './model/recommendation'
export { AiSentenceNotice } from './ui/AiSentenceNotice'
export { FitBadge } from './ui/FitBadge'
export { PickReveal } from './ui/PickReveal'
export { RecommendedPicksLoading } from './ui/RecommendedPicksLoading'
export { RecommendedPicksNotice } from './ui/RecommendedPicksNotice'
export { SizeReasonList } from './ui/SizeReasonList'
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
  toReferenceGarmentFormFromPurchase,
  toReferenceGarmentFromPurchase,
  type PurchaseSource,
  type PurchasedProduct,
  toReferenceGarmentRequest,
} from './model/reference-garment.mapper'
export {
  categoriesForPart,
  garmentPartOf,
  isValidMeasurementText,
  measurementCodesOf,
  partsForPurchase,
  referencePartToRegister,
  validateReferenceGarmentForm,
} from './model/reference-garment.rules'
export { type PurchasedGarment } from './model/purchased-garment'
export { toPurchasedGarment } from './model/purchased-garment.mapper'
