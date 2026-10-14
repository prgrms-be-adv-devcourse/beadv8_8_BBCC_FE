/** GET /seller/orders 한 줄 = 판매자 몫의 배송 1건. 상태 값은 주문의 배송 상태와 같다 */
export type SellerOrder = {
  sellerOrderId: string
  orderId: string
  status: 'READY' | 'SHIPPING' | 'DELIVERED'
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
    status: 'ORDERED' | 'CONFIRMED'
    child: { name: string; heightCm: number } | null
  }[]
}
