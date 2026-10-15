// 사이즈 추천은 실제 API(BE #262). 자녀 맞춤 목록은 백엔드에 아직 없다(목 응답). 값 이름은 백엔드 recommend 도메인(Fit · SizeNotice)을 따른다

/** GET /products/{productId}/size-recommendation?childId= */
export type SizeRecommendationDto = {
  productId: string
  childId: string
  /** 맞는 사이즈가 없거나 사이즈 무관 상품이면 null */
  recommendedSize: string | null
  /** 추천 사이즈가 없으면 null */
  fit: string | null
  /** 안내. message는 화면에 그대로 보여 준다 (SIZE_FREE · NO_MATCHING_SIZE · BODY_TYPE_ADJUSTED …) */
  notices: { code: string; message: string }[]
  /** 추천 사이즈를 고른 후보 (작은 것부터). 추천이 없으면 빈 목록 */
  candidateSizes: string[]
  /** 같은 카테고리에서 이 자녀에게 산 사이즈. 지금은 늘 null */
  lastPurchasedSize: string | null
}

/** GET /children/{childId}/recommended-products 한 줄 */
export type RecommendedProductDto = {
  productId: string
  name: string
  categoryId: string
  brand: string | null
  minPrice: number | null
  thumbnailUrl: string | null
  recommendedSize: string
  fit: string
}
