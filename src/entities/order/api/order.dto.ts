// 백엔드 OrderDetailResponse · OrderSummaryResponse · PlaceOrderRequest 그대로 (주문 쪽 ID는 문자열)

export type OrderItemDto = {
  orderItemId: string
  productId: string
  optionId: string
  sellerId: string
  productName: string
  size: string
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
