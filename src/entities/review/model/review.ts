/** 사이즈 핏: 구매한 사이즈가 어땠는지 (선택) */
export type Fit = 'SMALL' | 'TRUE_TO_SIZE' | 'LARGE'

export type Review = {
  id: string
  orderItemId: string
  productId: string
  /** 작성 응답에는 없고, 목록은 상품 정보를 아직 받지 못했으면 null */
  productName: string | null
  thumbnailUrl: string | null
  /** 1~5 */
  rating: number
  content: string
  /** 화면에 보일 작성자 (탈퇴했으면 「탈퇴한 회원」) */
  authorName: string
  fit: Fit | null
  /** 사이즈 없는 상품이면 null */
  purchasedSize: string | null
  imageUrls: string[]
  /** 검토 중(내 리뷰에만 보인다) */
  isUnderReview: boolean
  createdAt: string
  /** 작성자가 고친 적 있는지 (BE #1308부터 updatedAt은 작성자가 고칠 때만 바뀐다) */
  isEdited: boolean
}

/** 핏별 리뷰 수 (핏을 남긴 리뷰만) */
export type FitCounts = Record<Fit, number>

export type ReviewSummary = {
  productId: string
  count: number
  /** 소수 첫째 자리. 리뷰가 없으면 null */
  averageRating: number | null
  fit: FitCounts
}

/** 리뷰를 쓸 수 있는 주문상품 (구매확정했고 아직 쓰지 않음) */
export type ReviewableItem = {
  orderItemId: string
  orderId: string | null
  productId: string
  productName: string | null
  thumbnailUrl: string | null
  /** 사이즈 없는 상품이면 null → 핏을 고를 수 없다 */
  size: string | null
  confirmedAt: string
}

/** 리뷰 쓰기 · 고치기 입력 */
export type ReviewDraft = {
  rating: number | null
  fit: Fit | null
  content: string
  imageUrls: string[]
}

export type ReviewDraftErrors = Partial<Record<keyof ReviewDraft, string>>

/** 주문 상세에서 주문상품 줄의 리뷰 동작 */
export type ReviewAction = 'write' | 'written' | 'preparing'
