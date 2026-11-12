import { apiClient, expectShape, type Page } from '@/shared/api'
import type { DeliveryDto, SellerOrderDto, ShipRequestDto } from './seller-order.dto'
import { deliveryShape, sellerOrderPageShape } from './seller-order.shape'

export const sellerOrderApi = {
  /** 판매 주문(배송 단위) 20건씩 (page는 0부터) */
  list: (page = 0) =>
    apiClient
      .get<Page<SellerOrderDto>>('/seller/orders', { params: { page, size: 20 } })
      .then(expectShape(sellerOrderPageShape)),
  ship: (sellerOrderId: string, request: ShipRequestDto) =>
    apiClient
      .post<DeliveryDto>(`/seller/orders/${sellerOrderId}/ship`, request)
      .then(expectShape(deliveryShape)),
  /** 이미 완료여도 200 */
  deliver: (sellerOrderId: string) =>
    apiClient
      .post<DeliveryDto>(`/seller/orders/${sellerOrderId}/deliver`)
      .then(expectShape(deliveryShape)),
}
