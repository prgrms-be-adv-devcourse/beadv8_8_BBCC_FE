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
    child: { name: string; heightCm: number } | null
  }[]
}

/** POST /seller/orders/{sellerOrderId}/ship */
export type ShipRequestDto = { carrier: string; trackingNumber: string }
