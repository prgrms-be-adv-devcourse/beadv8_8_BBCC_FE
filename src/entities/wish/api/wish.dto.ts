/** BE WishRequestResponse.Line (#999). ID는 문자열 */
export type WishRequestLineDto = {
  /** 장바구니 칸 ID. #999 전 조르기는 null */
  cartItemId: string | null
  optionId: string
  productId: string | null
  sellerId: string | null
  productName: string | null
  optionName: string | null
  size: string | null
  sellerName: string | null
  /** 보낸 때 칸 수량 */
  quantity: number
  /** 지금 가격. 상품 정보가 없으면 null */
  unitPrice: number | null
  purchasable: boolean
  saleStatus: string | null
  /** 결제돼 장바구니에서 빠졌는지 */
  purchased: boolean
  /** 상품의 지금 사진 (BE #1328). 없으면 null */
  thumbnailUrl?: string | null
}

/** BE WishRequestResponse.Purchase. quantity는 그 칸에서 이번에 산 수량 */
export type WishPurchaseDto = {
  orderId: string
  cartItemId: string | null
  quantity: number
  purchasedAt: string
}

/** BE WishRequestResponse (GET · POST /wish/requests, 거절 · 철회 응답도 같음) */
export type WishRequestDto = {
  requestId: string
  type: string
  childId: string
  status: 'REQUESTED' | 'PAID' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'
  requestedByType: 'MEMBER' | 'CHILD'
  requestedById: string
  message: string | null
  requestedAt: string
  payerType: string | null
  payerId: string | null
  paidAt: string | null
  rejectReason: 'TOO_EXPENSIVE' | 'ALREADY_HAVE' | 'NEXT_TIME' | 'OTHER' | null
  rejectedAt: string | null
  cancelReason: string | null
  cancelledAt: string | null
  /** 만료 예정 시각(#1008). 대기 중이고 만료가 켜져 있을 때만, 그 밖은 null */
  expiresAt: string | null
  /** 만료 처리 시각. 만료가 아니면 null */
  expiredAt: string | null
  items: WishRequestLineDto[]
  purchases: WishPurchaseDto[]
  paidOrderItemIds: string[]
}

/** BE WishTimelineResponse. steps: SENT → PAID · REJECTED · CANCELLED · EXPIRED */
export type WishTimelineDto = {
  requestId: string
  status: string
  rejectReason: string | null
  cancelReason: string | null
  orderIds: string[]
  steps: { step: string; status: 'DONE' | 'WAITING'; at: string | null }[]
  cancelledBy: string | null
}
