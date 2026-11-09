// 실제 API(BE community ReviewController · ReviewQueryController · ReviewEligibilityController, develop)
// ID는 모두 문자열, 시각은 서울 시간(시간대 없음)

/** POST /reviews · PATCH /reviews/{reviewId} 응답 (BE ReviewResponse) */
export type ReviewDto = {
  reviewId: string
  orderItemId: string
  productId: string
  rating: number
  content: string
  /** 작성 시점 닉네임. 탈퇴했으면 "탈퇴한 회원", 몰랐으면 null */
  nickname: string | null
  authorWithdrawn: boolean
  /** SMALL · TRUE_TO_SIZE · LARGE. 남기지 않았으면 null */
  fit: string | null
  /** 사이즈 없는 상품이면 null */
  purchasedSize: string | null
  imageUrls: string[]
  createdAt: string
  updatedAt: string
}

/** GET /reviews?productId= · GET /reviews/me 항목 (BE ReviewListResponse.Item) */
export type ReviewListItemDto = ReviewDto & {
  /** 상품 정보를 아직 받지 못했으면 null */
  productName: string | null
  thumbnailUrl: string | null
  /** ON_SALE · SOLD_OUT · SALE_ENDED. 상품 정보를 아직 받지 못했으면 null */
  displayStatus: string | null
  /** PUBLIC · UNDER_REVIEW(검토 중, 내 리뷰에만) */
  visibility: string
}

/** 커서 목록 (BE ReviewListResponse · EligibleReviewsResponse). nextCursor: 마지막 쪽이면 null */
export type CursorPageDto<T> = { items: T[]; nextCursor: string | null }

/** GET /reviews/summary?productId= (BE ReviewSummaryResponse). averageRating: 소수 첫째 자리, 리뷰가 없으면 null */
export type ReviewSummaryDto = {
  productId: string
  reviewCount: number
  averageRating: number | null
  fitSummary: { small: number; trueToSize: number; large: number }
}

/** GET /reviews/eligible 항목 (BE EligibleReviewsResponse.Item): 구매확정했고 아직 리뷰를 쓰지 않은 주문상품 */
export type ReviewableItemDto = {
  orderItemId: string
  orderId: string | null
  productId: string
  productName: string | null
  thumbnailUrl: string | null
  /** 사이즈 없는 상품이면 null (핏을 고를 수 없다) */
  size: string | null
  confirmedAt: string
}
