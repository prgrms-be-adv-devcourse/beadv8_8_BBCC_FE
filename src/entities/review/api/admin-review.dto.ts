/** GET /admin/community/reviews 항목 (BE AdminReviewListResponse.Item) */
export type AdminReviewDto = {
  reviewId: string
  productId: string
  /** PENDING · PASSED · HIDDEN · CONFIRMED_HIDDEN · RESTORED */
  status: string
  /** PROFANITY · HATE · SEXUAL · VIOLENCE · ILLEGAL · PRIVACY · OTHER. 없으면 null */
  reason: string | null
  moderatedAt: string | null
  attempts: number
  attemptsExhausted: boolean
  content: string
  imageUrls: string[]
  createdAt: string
}

export type AdminReviewListDto = { items: AdminReviewDto[]; nextCursor: string | null }
