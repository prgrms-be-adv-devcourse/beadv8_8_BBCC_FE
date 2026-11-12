import { deliveryShape } from '@/entities/seller-order'
import { apiClient, expectShape } from '@/shared/api'
import type { CancelledDeliveryDto, CancelSellerOrderRequestDto } from './cancel-seller-order.dto'

export const cancelSellerOrderApi = {
  /** 발송 전 내 몫 취소. 발송 뒤 · 이미 취소 · 스위치 꺼짐이면 409 */
  cancel: (sellerOrderId: string, request: CancelSellerOrderRequestDto) =>
    apiClient
      .post<CancelledDeliveryDto>(`/seller/orders/${sellerOrderId}/cancel`, request)
      .then(expectShape(deliveryShape)),
}
