// 사이즈 추천(BE #262) · 자녀 맞춤 목록(BE #316) 모두 실제 API. 값 이름은 백엔드 recommend 도메인(Fit · SizeNotice)을 따른다

import type { Page } from '@/shared/api'

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
