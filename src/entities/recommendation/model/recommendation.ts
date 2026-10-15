export type Fit = 'ROOMY' | 'PROPER' | 'TIGHT'

export type SizeRecommendation = {
  recommendedSize: string | null
  fit: Fit | null
  /** 추천 이유 (화면에 그대로 보여 준다) */
  reasons: string[]
}

export type RecommendedProduct = {
  id: string
  name: string
  categoryId: string
  brand: string | null
  minPrice: number | null
  /** 대표 이미지 (S3). 없으면 null → 기본 이미지 */
  imageUrl: string | null
  recommendedSize: string
  fit: Fit
}

export const FIT_LABEL: Record<Fit, string> = {
  ROOMY: '여유 있음',
  PROPER: '적정',
  TIGHT: '작을 가능성 있음',
}
