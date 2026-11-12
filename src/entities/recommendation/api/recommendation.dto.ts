// 사이즈 추천(BE #262) · 자녀 맞춤 목록(BE #316) 모두 실제 API. 값 이름은 백엔드 recommend 도메인(Fit · SizeNotice)을 따른다

import type { Page } from '@/shared/api'
import type { WearPreviewDto } from './wear-preview.dto'

/** GET /recommendations/size?productId=&childId= */
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
  /** 추천을 정한 쪽. AI가 고른 사이즈는 candidateSizes 밖일 수 있다 */
  source: RecommendationSourceDto
  /** 사이즈를 고른 근거 (RULE이면 []) */
  reasons: SizeReasonDto[]
  // 기준 핏 (BE #1261)
  /** 기준 옷과 이 상품을 사이즈별로 비교한 값. 기준 옷이 없거나 비교할 항목이 없으면 null */
  referenceFit: ReferenceFitDto | null
  /** AI가 추천 사이즈를 항목별로 판단한 값. RULE이거나 판단이 없으면 [] */
  itemJudgements: ItemJudgementDto[]
  /** 착용 미리보기 (BE #1265). 사이즈 무관 상품 · 모자 · 양말이면 null */
  wearPreview: WearPreviewDto | null
}

/**
 * 기준 핏. part는 TOP · BOTTOM · OUTER · DRESS · SKIRT. comparedPart가 productPart와 다르면
 * 다른 칸의 기준 옷으로 대신 비교한 것이고, 이때는 너비 항목만 있다
 */
export type ReferenceFitDto = {
  productPart: string
  comparedPart: string
  /** 실측 항목마다 기준 옷 실측과 사이즈별 상품 실측 · 차이(상품 − 기준 옷, cm) */
  items: {
    code: string
    garmentCm: number
    sizes: { size: string; productCm: number; diffCm: number }[]
  }[]
}

/** 추천 사이즈의 항목별 AI 판단. fit은 응답의 fit과 같은 값, allowance는 AI가 맞다고 본 여유 범위(cm) */
export type ItemJudgementDto = {
  code: string
  diffCm: number
  fit: string
  allowanceMinCm: number
  allowanceMaxCm: number
}

/** 사이즈 추천 근거. type은 HEIGHT · BODY_TYPE · PREFERRED_FIT · MEASUREMENT · RULE_RESULT · GROWTH */
export type SizeReasonDto = {
  type: string
  /** 화면에 그대로 보여 주는 문구 */
  detail: string
  /** 근거로 쓴 글 조각 ID. BE가 글 조각을 AI에 주지 않아 지금은 늘 null */
  sourceId: string | null
}

/** GET /recommendations/products?childId= 한 줄 */
export type RecommendedProductDto = {
  productId: string
  name: string
  thumbnailUrl: string | null
  /** 판매자 상호명. 아직 모르면 null */
  businessName: string | null
  minPrice: number | null
  /** 사이즈 무관 상품이면 null */
  recommendedSize: string | null
}

/** GET /recommendations/products 요청 값 (childId는 요청 함수가 붙인다) */
export type RecommendedProductsParamsDto = {
  categoryId?: string
  page: number
  size: number
  /** 2쪽부터 1쪽 응답의 asOf를 그대로 보낸다. 지금보다 늦거나 형식이 틀리면 400 */
  asOf?: string
}

/** GET /recommendations/products 응답: 공통 목록 응답 + 목록 기준 시각 (한국 시간 LocalDateTime, 초 단위) */
export type RecommendedProductPageDto = Page<RecommendedProductDto> & { asOf: string }

/** 추천을 고른 쪽: AI가 골랐으면 AI, AI를 쓸 수 없어 규칙으로 골랐으면 RULE */
export type RecommendationSourceDto = 'AI' | 'RULE'

/** 추천 카드 + 추천 이유. 이유가 없으면(규칙으로 채운 상품 등) null */
export type RecommendedPickDto = RecommendedProductDto & { reason: string | null }

/** AI · 규칙이 고른 추천 묶음 (후보가 없으면 products는 []) */
type RecommendedPicksDto = {
  source: RecommendationSourceDto
  products: RecommendedPickDto[]
}

/** GET /recommendations/companions?productId=&childId= (최대 4개) */
export type CompanionProductsDto = RecommendedPicksDto

/** GET /recommendations/products/preview?childId= (홈 맛보기 4개. AI여도 reason은 null일 수 있다) */
export type HomePreviewDto = RecommendedPicksDto
