/** REQUESTED 대기 · PAID 결제 완료(승인 = 결제) · REJECTED 거절 · CANCELLED 철회 · EXPIRED 기한 지나 만료(BE #1008) */
export type WishStatus = 'REQUESTED' | 'PAID' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'
export type WishRequestLine = {
  /** 예약된 장바구니 칸. 승인은 이 칸으로 주문한다. #999 전 조르기는 null */
  cartItemId: string | null
  optionId: string
  productId: string | null
  sellerId: string | null
  productName: string
  optionName: string | null
  size: string | null
  sellerName: string | null
  /** 보낸 때 수량 */
  quantity: number
  unitPrice: number | null
  purchasable: boolean
  saleStatus: string | null
  /** 이 칸에서 결제로 산 수량 합 */
  purchasedQuantity: number
}
export type WishRequest = {
  requestId: string
  childId: string
  status: WishStatus
  requestedByType: 'MEMBER' | 'CHILD'
  message: string | null
  requestedAt: string
  /** 결제 · 거절 · 철회 시각. 대기면 null */
  decidedAt: string | null
  /** 만료 예정 시각. 대기 중이고 만료가 켜져 있을 때만 */
  expiresAt: string | null
  /** 만료된 시각. 만료가 아니면 null */
  expiredAt: string | null
  rejectReason: 'TOO_EXPENSIVE' | 'ALREADY_HAVE' | 'NEXT_TIME' | 'OTHER' | null
  /** 조르기로 산 주문 (먼저 산 것부터, 겹치지 않게) */
  orderIds: string[]
  /** 이 조르기로 결제된 주문상품 ID (BE #1000, 결제 반영 전엔 빈 목록) */
  paidOrderItemIds: string[]
  items: WishRequestLine[]
}
export type WishTimelineStep = { step: string; status: 'DONE' | 'WAITING'; at: string | null }
export type WishTimeline = {
  requestId: string
  status: string
  orderIds: string[]
  steps: WishTimelineStep[]
}
