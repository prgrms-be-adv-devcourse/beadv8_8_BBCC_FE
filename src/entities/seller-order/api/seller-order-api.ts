import { apiClient, expectShape, type Page } from '@/shared/api'
import type { SellerOrderDto, ShipRequestDto } from './seller-order.dto'
import { sellerOrderPageShape } from './seller-order.shape'

export const sellerOrderApi = {
  list: () =>
    apiClient
      .get<Page<SellerOrderDto>>('/seller/orders', { params: { page: 0, size: 20 } })
      .then(expectShape(sellerOrderPageShape)),
  ship: (sellerOrderId: string, request: ShipRequestDto) =>
    apiClient.post(`/seller/orders/${sellerOrderId}/ship`, request),
  /** 이미 완료여도 200 */
  deliver: (sellerOrderId: string) => apiClient.post(`/seller/orders/${sellerOrderId}/deliver`),
}
