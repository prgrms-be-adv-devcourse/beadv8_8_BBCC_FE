/**
 * PATCH /reviews/{reviewId} 요청 (BE UpdateReviewRequest). 보낸 키만 바꾼다:
 * fit null = 핏 지움, imageUrls = 사진 목록 전체(빈 목록 = 모두 지움). 넷 다 없으면 400 NO_FIELDS_TO_UPDATE
 */
export type UpdateReviewRequestDto = {
  rating?: number
  content?: string
  fit?: string | null
  imageUrls?: string[]
}

/** 200 응답은 리뷰 한 건(엔티티 reviewShape로 검사). 이 기능은 다시 조회하므로 ID만 읽는다 */
export type UpdatedReviewDto = { reviewId: string }
