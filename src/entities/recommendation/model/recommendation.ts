export type Fit = 'ROOMY' | 'PROPER' | 'TIGHT'

/** 사이즈 하나의 권장 키 범위와, 이 자녀 키로 본 적합도 (범위 ±2cm 밖이면 null) */
export type SizeRange = {
  size: string
  minHeightCm: number
  maxHeightCm: number
  fit: Fit | null
}

export type SizeRecommendation = {
  recommendedSize: string | null
  fit: Fit | null
  /** 추천 이유 (화면에 그대로 보여 준다) */
  reasons: string[]
  sizes: SizeRange[]
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
