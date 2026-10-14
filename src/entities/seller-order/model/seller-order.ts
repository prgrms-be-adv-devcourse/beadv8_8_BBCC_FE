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
    size: string
    quantity: number
    amount: number
    childLabel: string | null
  }[]
}

/** 지금 할 수 있는 다음 처리 */
export type NextShippingStep = 'SHIP' | 'DELIVER' | null
