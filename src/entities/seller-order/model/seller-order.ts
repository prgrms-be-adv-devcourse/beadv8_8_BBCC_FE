import type { DeliveryStatus } from '@/shared/config'

/** 판매자 몫의 배송 1건 */
export type SellerOrder = {
  id: string
  orderId: string
  status: DeliveryStatus
  carrier: string | null
  trackingNumber: string | null
  orderedAt: string
  recipientName: string
  address: string
  items: {
    id: string
    productName: string
    optionName: string | null
    size: string | null
    quantity: number
    amount: number
    /** 발송 전 취소 등으로 이 주문상품이 취소됨 (BE 주문상품 CANCELLED) */
    isCancelled: boolean
  }[]
}

/** 지금 할 수 있는 다음 처리 */
export type NextShippingStep = 'SHIP' | 'DELIVER' | null
