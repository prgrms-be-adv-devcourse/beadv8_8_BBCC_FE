// 백엔드 OrderDetailResponse · OrderSummaryResponse · PlaceOrderRequest 그대로 (주문 쪽 ID는 문자열)

export type OrderItemDto = {
  orderItemId: string
  productId: string
  optionId: string
  sellerId: string
  productName: string
  /** 옵션 이름 (BE #221, 옛 주문상품은 null) */
  optionName: string | null
  /** 사이즈가 없는 상품은 null */
  size: string | null
  unitPrice: number
  quantity: number
  amount: number
  status: string
  deliveredAt: string | null
  confirmedAt: string | null
  confirmType: string | null
  /**
   * 재고 차감 실패로 살 수 없던 이유 (BE 예정 필드, 주문상품 단위). 없으면 null.
   * OUT_OF_STOCK · PRODUCT_NOT_ON_SALE · OPTION_NOT_ON_SALE, 그 밖의 값도 올 수 있다
   */
  unavailableReason?: string | null
  child: {
    childId: string
    name: string
    heightCm: number
    weightKg: number
    bodyType: string | null
  } | null
}

export type OrderDeliveryDto = {
  sellerOrderId: string
  sellerId: string
  status: string
  carrier: string | null
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
}

export type OrderDetailDto = {
  orderId: string
  status: string
  cancelReason: string | null
  totalAmount: number
  orderedAt: string
  paymentDueAt: string | null
  shippingAddress: { recipientName: string; phone: string; zipCode: string; address: string }
  items: OrderItemDto[]
  deliveries: OrderDeliveryDto[]
}

export type OrderSummaryDto = {
  orderId: string
  status: string
  totalAmount: number
  orderedAt: string
  /** 주문상품 ID가 가장 작은 주문상품의 주문 당시 상품명. 찾지 못하면 null */
  representativeProductName: string | null
  /** 주문상품 수 (행 수, 수량 합 아님). 찾지 못하면 0 */
  itemCount: number
}

/** POST /orders */
export type PlaceOrderRequestDto = {
  items: { optionId: number; childId: number | null; quantity: number; unitPrice: number }[]
  shippingAddress: { recipientName: string; phone: string; zipCode: string; address: string }
}

/** GET /admin/orders 한 줄 (기획서 8장 보완 · BE 미구현 → 목) */
export type AdminOrderDto = {
  orderId: string
  memberId: number
  status: string
  cancelReason: string | null
  totalAmount: number
  orderedAt: string
  itemCount: number
}
