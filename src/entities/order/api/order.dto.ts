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
