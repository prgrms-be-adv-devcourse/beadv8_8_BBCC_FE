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
