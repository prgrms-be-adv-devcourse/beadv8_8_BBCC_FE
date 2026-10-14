export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED'
export type CancelReason = 'OUT_OF_STOCK' | 'PAYMENT_FAILED' | 'PAYMENT_EXPIRED'
export type OrderItemStatus = 'ORDERED' | 'CONFIRMED'
export type ConfirmType = 'DIRECT' | 'AUTO'
export type DeliveryStatus = 'READY' | 'SHIPPING' | 'DELIVERED'

export type OrderShippingAddress = {
  recipientName: string
  phone: string
  zipCode: string
  address: string
}

export type OrderItem = {
  orderItemId: string
  productId: string
  optionId: string
  sellerId: string
  productName: string
  size: string
  unitPrice: number
  quantity: number
  amount: number
  status: OrderItemStatus
  deliveredAt: string | null
  confirmedAt: string | null
  confirmType: ConfirmType | null
  /** 주문 당시 자녀 정보. 자녀를 고르지 않았으면 null */
  child: {
    childId: string
    name: string
    heightCm: number
    weightKg: number
    bodyType: string | null
  } | null
}

/** 판매자별 배송 */
export type OrderDelivery = {
  sellerOrderId: string
  sellerId: string
  status: DeliveryStatus
  carrier: string | null
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
}

/** GET /orders/{orderId} · POST /orders 응답 */
export type OrderDetail = {
  orderId: string
  status: OrderStatus
  cancelReason: CancelReason | null
  totalAmount: number
  orderedAt: string
  paymentDueAt: string | null
  shippingAddress: OrderShippingAddress
  items: OrderItem[]
  deliveries: OrderDelivery[]
}

/** GET /orders 한 줄 */
export type OrderSummary = {
  orderId: string
  status: OrderStatus
  totalAmount: number
  orderedAt: string
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '결제 처리 중',
  PAID: '결제 완료',
  CANCELLED: '구매하지 못했어요',
}

export const CANCEL_REASON_LABEL: Record<CancelReason, string> = {
  OUT_OF_STOCK: '재고가 부족해요',
  PAYMENT_FAILED: '예치금 결제에 실패했어요 (잔액 부족 등)',
  PAYMENT_EXPIRED: '결제 제한 시간(10분)이 지났어요',
}

export const ITEM_STATUS_LABEL: Record<OrderItemStatus, string> = {
  ORDERED: '주문됨',
  CONFIRMED: '구매확정',
}

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  READY: '발송 준비',
  SHIPPING: '배송 중',
  DELIVERED: '배송 완료',
}

export const CARRIERS = [
  { code: 'CJ', name: 'CJ대한통운' },
  { code: 'EPOST', name: '우체국택배' },
  { code: 'HANJIN', name: '한진택배' },
  { code: 'LOTTE', name: '롯데택배' },
  { code: 'LOGEN', name: '로젠택배' },
]

export function carrierName(code: string | null): string {
  return CARRIERS.find((carrier) => carrier.code === code)?.name ?? code ?? '-'
}
