/** GET /seller/orders 한 줄 (백엔드 SellerOrderResponse) */
export type SellerOrderDto = {
  sellerOrderId: string
  orderId: string
  status: string
  carrier: string | null
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
  orderedAt: string
  shippingAddress: { recipientName: string; phone: string; zipCode: string; address: string }
  items: {
    orderItemId: string
    productName: string
    /** 옵션 이름 (BE #221, 옛 주문상품은 null) */
    optionName: string | null
    /** 사이즈가 없는 상품은 null */
    size: string | null
    unitPrice: number
    quantity: number
    amount: number
    status: string
    /** 재고 차감 실패로 살 수 없던 이유. 그 밖에는 null */
    unavailableReason?: string | null
    /** 판매자 상호. 판매 주문 목록에서는 null */
    sellerName?: string | null
    /** 주문 당시 자녀. 이름은 null일 수 있다 (회원의 자녀 변경 이벤트에 이름이 없음) */
    child: { name: string | null; heightCm: number } | null
  }[]
}

/** POST /seller/orders/{sellerOrderId}/ship */
export type ShipRequestDto = { carrier: string; trackingNumber: string }

/** POST /seller/orders/{id}/ship · /deliver (BE DeliveryResponse) */
export type DeliveryDto = {
  sellerOrderId: string
  orderId: string
  status: string
  carrier: string | null
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
}
