import type { DeliveryStatus } from '@/shared/config'

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED'
/** BE Order.CancelReason */
export type CancelReason =
  | 'OUT_OF_STOCK'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_EXPIRED'
  | 'BUYER_CANCELLED'
  | 'SELLER_CANCELLED'
  | 'SELLER_UNAVAILABLE'
/** BE OrderItem.Status. CANCELLED: 판매자 발송 전 취소 등으로 그 상품만 취소됨 */
export type OrderItemStatus = 'ORDERED' | 'CONFIRMED' | 'CANCELLED'
/** BE OrderItem.CancelReason (판매자 발송 전 취소 사유 + 시스템 정리) */
export type ItemCancelReason =
  'OUT_OF_STOCK' | 'WRONG_PRODUCT_INFO' | 'OTHER' | 'SELLER_UNAVAILABLE'
export type ConfirmType = 'DIRECT' | 'AUTO'

export type OrderItem = {
  id: string
  productId: string
  optionId: string
  sellerId: string
  productName: string
  optionName: string | null
  size: string | null
  unitPrice: number
  quantity: number
  amount: number
  status: OrderItemStatus
  deliveredAt: string | null
  confirmedAt: string | null
  confirmType: ConfirmType | null
  /** 재고 차감 실패로 살 수 없던 이유 (주문상품 단위). 없으면 null → 표시 없음 */
  unavailableReason: string | null
  /** 판매자 상호명. 모르면 null */
  sellerName: string | null
  /** 주문 당시 자녀 정보. 고르지 않았으면 null */
  /** name: 주문 당시 자녀 이름, 비어 있으면 null */
  child: { id: string; name: string | null; heightCm: number; weightKg: number } | null
}

/** 판매자별 배송 */
export type OrderDelivery = {
  id: string
  sellerId: string
  /** 그 판매자 주문상품의 상호명. 모르면 null */
  sellerName: string | null
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
  /** 결제 마감 (BE kidly.order.payment-timeout, 기본 10분). 이때까지 결제가 끝나지 않으면 PAYMENT_EXPIRED로 취소 */
  paymentDueAt: string | null
  shippingAddress: { recipientName: string; phone: string; zipCode: string; address: string }
  items: OrderItem[]
  deliveries: OrderDelivery[]
}

export type OrderSummary = {
  id: string
  status: OrderStatus
  totalAmount: number
  orderedAt: string
  /** 대표 상품 (예: "데일리 맨투맨 외 1건"). 상품명을 모르면 null */
  title: string | null
  /** 대표 상품 판매자 상호명. 모르면 null */
  sellerName: string | null
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
  /** 재고 부족 · 판매 중지를 모두 포함 (BE cancelReason 하나) */
  OUT_OF_STOCK: '구매할 수 없는 상품이 있어 주문이 취소됐어요.',
  PAYMENT_FAILED: '예치금 결제에 실패했어요 (잔액 부족 등)',
  PAYMENT_EXPIRED: '결제 마감 시간이 지나 주문이 자동으로 취소됐어요.',
  BUYER_CANCELLED: '주문을 취소했어요.',
  SELLER_CANCELLED: '판매자가 주문을 취소했어요.',
  /** 판매자 정지 · 탈퇴 때 시스템이 배송 전 주문을 정리 */
  SELLER_UNAVAILABLE: '판매자 사정으로 판매할 수 없게 되어 주문이 취소됐어요.',
}

export const ITEM_CANCEL_REASON_LABEL: Record<ItemCancelReason, string> = {
  OUT_OF_STOCK: '재고 없음',
  WRONG_PRODUCT_INFO: '상품 정보 오류',
  OTHER: '판매자 사정',
  SELLER_UNAVAILABLE: '판매자 사정으로 판매 불가',
}

/** 주문상품 단위 구매 불가 이유 (BE items[].unavailableReason). 모르는 값은 "구매 불가" */
export const UNAVAILABLE_REASON_LABEL: Record<string, string> = {
  OUT_OF_STOCK: '재고 부족',
  PRODUCT_NOT_ON_SALE: '판매 중지',
  OPTION_NOT_ON_SALE: '옵션 판매 중지',
}

export const ITEM_STATUS_LABEL: Record<OrderItemStatus, string> = {
  ORDERED: '주문됨',
  CONFIRMED: '구매확정',
  CANCELLED: '취소됨',
}

/** 주문하기 입력 (화면 모델 기준). 요청 DTO로는 매퍼가 바꾼다 */
export type PlaceOrderInput = {
  items: {
    optionId: string
    childId: string | null
    quantity: number
    unitPrice: number
    /** 이 줄을 산 장바구니 칸 (조르기 승인: 예약된 칸) */
    cartItemId?: string
  }[]
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
  /** 취소 시각 (취소 주문만, 아니면 null) */
  cancelledAt: string | null
}
