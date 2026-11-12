import type { ItemJudgement, ReferenceFit } from './reference-fit'

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
  /** 추천을 정한 쪽. AI가 고른 사이즈는 후보 밖일 수 있다 */
  source: RecommendationSource
  /** 사이즈를 고른 근거 (규칙이면 빈 목록) */
  reasons: SizeReason[]
  // 기준 핏 (BE #1261)
  /** 기준 옷과 사이즈별로 비교한 값. 기준 옷이 없거나 비교할 항목이 없으면 null */
  referenceFit: ReferenceFit | null
  /** AI가 추천 사이즈를 항목별로 판단한 값. 규칙 추천이면 빈 목록 */
  itemJudgements: ItemJudgement[]
}

export type SizeReasonType =
  'HEIGHT' | 'BODY_TYPE' | 'PREFERRED_FIT' | 'MEASUREMENT' | 'RULE_RESULT' | 'GROWTH'

/** 사이즈 근거 하나: 종류 라벨 + 문구(그대로 보인다) */
export type SizeReason = { type: SizeReasonType; detail: string }

export const SIZE_REASON_LABEL: Record<SizeReasonType, string> = {
  HEIGHT: '키',
  BODY_TYPE: '체형',
  PREFERRED_FIT: '선호 핏',
  MEASUREMENT: '실측',
  RULE_RESULT: '키 기준표',
  GROWTH: '성장',
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

/** 추천을 고른 쪽 (AI · 규칙). 사용자 화면에는 보이지 않고 흐름 패널에서 본다 */
export type RecommendationSource = 'AI' | 'RULE'

/** 추천 카드 + 추천 이유. 이유가 없으면 null → 이유 칸을 숨긴다 (기본 문구를 넣지 않는다) */
export type RecommendedPick = RecommendedProduct & { reason: string | null }

/** AI · 규칙이 고른 추천 상품 묶음 (홈 맛보기 · 함께 사면 좋은 상품) */
export type RecommendedPicks = {
  source: RecommendationSource
  products: RecommendedPick[]
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
  /** 목록 기준 시각 (1쪽 응답의 asOf). 1쪽은 비운다 */
  asOf?: string | null
}
