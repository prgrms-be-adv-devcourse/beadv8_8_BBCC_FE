// 추천 API는 백엔드에 아직 없다(목 응답). 값 이름은 백엔드 recommend 도메인(Fit · SizeNotice)을 따른다
export type Fit = 'ROOMY' | 'PROPER' | 'TIGHT'

/** GET /products/{productId}/size-recommendation?childId= */
export type SizeRecommendation = {
  productId: string
  childId: string
  /** 맞는 사이즈가 없으면 null */
  recommendedSize: string | null
  fit: Fit | null
  /** 추천 이유 (화면에 그대로 보여 준다) */
  reasons: string[]
  sizes: { size: string; minHeightCm: number; maxHeightCm: number; fit: Fit | null }[]
}

/** GET /children/{childId}/recommended-products 한 줄 */
export type RecommendedProduct = {
  productId: string
  name: string
  categoryName: string
  sellerName: string
  minPrice: number
  thumbnailUrl: string | null
  recommendedSize: string
  fit: Fit
}

export const FIT_LABEL: Record<Fit, string> = {
  ROOMY: '여유 있음',
  PROPER: '적정',
  TIGHT: '작을 가능성 있음',
}
