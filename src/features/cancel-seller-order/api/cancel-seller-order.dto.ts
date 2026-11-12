/** POST /seller/orders/{sellerOrderId}/cancel (BE CancelSellerOrderRequest #655). 응답은 배송 한 건(DeliveryResponse) */
export type CancelSellerOrderRequestDto = {
  /** OUT_OF_STOCK · WRONG_PRODUCT_INFO · OTHER */
  reason: string
  /** 판매자 메모(선택, 500자). 구매자 · 이벤트에는 실리지 않는다 */
  memo?: string
}

/** 응답 (BE DeliveryResponse, POST /seller/orders/{id}/cancel) */
export type CancelledDeliveryDto = {
  sellerOrderId: string
  orderId: string
  status: string
  carrier: string | null
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
}
