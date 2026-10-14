import type { DeliveryStatus } from '@/shared/config'

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED'
export type CancelReason = 'OUT_OF_STOCK' | 'PAYMENT_FAILED' | 'PAYMENT_EXPIRED'
export type OrderItemStatus = 'ORDERED' | 'CONFIRMED'
export type ConfirmType = 'DIRECT' | 'AUTO'

export type OrderItem = {
  id: string
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
  /** 주문 당시 자녀 정보. 고르지 않았으면 null */
  child: { id: string; name: string; heightCm: number; weightKg: number } | null
}

/** 판매자별 배송 */
export type OrderDelivery = {
  id: string
  sellerId: string
  status: DeliveryStatus
  carrier: string | null
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
}

export type Order = {
  id: string
  status: OrderStatus
  cancelReason: CancelReason | null
  totalAmount: number
  orderedAt: string
  shippingAddress: { recipientName: string; phone: string; zipCode: string; address: string }
  items: OrderItem[]
  deliveries: OrderDelivery[]
}

export type OrderSummary = {
  id: string
  status: OrderStatus
  totalAmount: number
  orderedAt: string
}

/** 상태 변화 순서 한 줄 */
export type OrderTimelineEvent = {
  at: string | null
  label: string
  /** 서버에서 일어난 일 (설계 기준) */
  note?: string
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

/** 주문하기 입력 (화면 모델 기준). 요청 DTO로는 매퍼가 바꾼다 */
export type PlaceOrderInput = {
  items: { optionId: string; childId: string | null; quantity: number; unitPrice: number }[]
  shippingAddress: { recipientName: string; phone: string; zipCode: string; address: string }
}

/** 관리자 전체 주문 한 줄 */
export type AdminOrder = {
  id: string
  memberId: string
  status: OrderStatus
  cancelReason: CancelReason | null
  totalAmount: number
  orderedAt: string
  itemCount: number
}
