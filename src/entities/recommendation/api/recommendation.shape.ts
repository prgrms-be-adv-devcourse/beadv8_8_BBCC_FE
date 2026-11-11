import { arr, bool, nullable, num, obj, oneOf, str } from '@/shared/api'

const FIT = oneOf(['ROOMY', 'PROPER', 'TIGHT'])
const SOURCE = oneOf(['AI', 'RULE'])
const SIZE_REASON_TYPE = oneOf([
  'HEIGHT',
  'BODY_TYPE',
  'PREFERRED_FIT',
  'MEASUREMENT',
  'RULE_RESULT',
  'GROWTH',
])

export const sizeRecommendationShape = obj({
  productId: str,
  childId: str,
  recommendedSize: nullable(str),
  fit: nullable(FIT),
  notices: arr(obj({ code: str, message: str })),
  candidateSizes: arr(str),
  lastPurchasedSize: nullable(str),
  source: SOURCE,
  reasons: arr(obj({ type: SIZE_REASON_TYPE, detail: str, sourceId: nullable(str) })),
})

const RECOMMENDED_CARD = {
  productId: str,
  name: str,
  thumbnailUrl: nullable(str),
  businessName: nullable(str),
  minPrice: nullable(num),
  recommendedSize: nullable(str),
}

/** 공통 목록 응답(PageResponse) 6칸 + 목록 기준 시각 asOf */
export const recommendedProductPageShape = obj({
  content: arr(obj(RECOMMENDED_CARD)),
  page: num,
  size: num,
  totalElements: num,
  totalPages: num,
  hasNext: bool,
  asOf: str,
})

/** 함께 사면 좋은 상품: 출처 + 카드(맞춤 목록 카드 칸 + 이유) */
export const companionProductsShape = obj({
  source: SOURCE,
  products: arr(obj({ ...RECOMMENDED_CARD, reason: nullable(str) })),
})

/** 홈 맛보기: 함께 사면 좋은 상품과 같은 모양 */
export const homePreviewShape = companionProductsShape
