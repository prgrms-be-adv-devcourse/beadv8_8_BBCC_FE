// 추천 API는 백엔드에 아직 없다(목 응답). 값 이름은 백엔드 recommend 도메인(Fit · SizeNotice)을 따른다

/** GET /products/{productId}/size-recommendation?childId= */
export type SizeRecommendationDto = {
  productId: string
  childId: string
  /** 맞는 사이즈가 없으면 null */
  recommendedSize: string | null
  fit: string | null
  reasons: string[]
  sizes: { size: string; minHeightCm: number; maxHeightCm: number; fit: string | null }[]
}

/** GET /children/{childId}/recommended-products 한 줄 */
export type RecommendedProductDto = {
  productId: string
  name: string
  categoryName: string
  sellerName: string
  minPrice: number
  thumbnailUrl: string | null
  recommendedSize: string
  fit: string
}
