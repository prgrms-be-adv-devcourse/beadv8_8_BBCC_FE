/** BE ApproveWishRequest */
export type ApproveWishRequestDto = {
  checkout: 'ORDER' | 'CART'
  items: { wishItemId: number; quantity: number; unitPrice: number | null }[]
  shippingAddress: { recipientName: string; phone: string; zipCode: string; address: string } | null
}

/** BE RejectWishRequest */
export type RejectWishRequestDto = { reason: string }

/** 승인 · 거절 응답은 조르기 상세다(모양은 엔티티 wishRequestShape로 검사). 이 기능은 주문 ID만 읽는다 */
export type WishDecisionResponseDto = { orderId: string | null }
