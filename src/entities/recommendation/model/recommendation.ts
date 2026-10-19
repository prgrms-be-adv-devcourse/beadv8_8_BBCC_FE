export type Fit = 'ROOMY' | 'PROPER' | 'TIGHT'

/** 사이즈 하나의 권장 키 범위 (상품 상세 실측) */
export type SizeRange = {
  size: string
  minHeightCm: number
  maxHeightCm: number
}

export type SizeNotice = { code: string; message: string }

export type SizeRecommendation = {
  recommendedSize: string | null
  fit: Fit | null
  /** 백엔드 안내 (message는 화면에 그대로) */
  notices: SizeNotice[]
  /** 추천 후보 사이즈 (자녀 키가 권장 키 ±2cm 안) */
  candidateSizes: string[]
  lastPurchasedSize: string | null
}

export type RecommendedProduct = {
  id: string
  name: string
  /** 판매자 상호명. 모르면 null */
  businessName: string | null
  minPrice: number | null
  /** 대표 이미지 (S3). 없으면 null → 기본 이미지 */
  imageUrl: string | null
  /** 사이즈 무관 상품이면 null */
  recommendedSize: string | null
}

export const FIT_LABEL: Record<Fit, string> = {
  ROOMY: '여유 있음',
  PROPER: '적정',
  TIGHT: '작을 가능성 있음',
}

/** 맞춤 목록 조회 조건. 카테고리는 말단만 (중간 카테고리는 빈 목록) */
export type RecommendedProductsQuery = {
  categoryId?: string | null
  page?: number
  size?: number
}
