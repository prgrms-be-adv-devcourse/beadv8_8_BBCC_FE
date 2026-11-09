/**
 * POST /reviews 요청 (BE WriteReviewRequest). 응답은 리뷰 한 건(엔티티 reviewShape로 검사).
 * fit · imageUrls는 선택: 없으면 키를 뺀다 (fit은 사이즈 있는 상품만, imageUrls는 업로드 주소 발급으로 받은 imageUrl, 5장까지)
 */
export type WriteReviewRequestDto = {
  orderItemId: string
  rating: number
  content: string
  fit?: string
  imageUrls?: string[]
}

/** 201 응답 (BE ReviewResponse). 모양은 엔티티 reviewShape로 검사하고, 엔티티 매퍼 toReview로 화면 모델을 만든다 */
export type WrittenReviewDto = {
  reviewId: string
  orderItemId: string
  productId: string
  rating: number
  content: string
  nickname: string | null
  authorWithdrawn: boolean
  fit: string | null
  purchasedSize: string | null
  imageUrls: string[]
  createdAt: string
  updatedAt: string
}
