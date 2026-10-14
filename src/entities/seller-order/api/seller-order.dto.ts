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
    size: string
    unitPrice: number
    quantity: number
    amount: number
    status: string
    child: { name: string; heightCm: number } | null
  }[]
}

/** POST /seller/orders/{sellerOrderId}/ship */
export type ShipRequestDto = { carrier: string; trackingNumber: string }
