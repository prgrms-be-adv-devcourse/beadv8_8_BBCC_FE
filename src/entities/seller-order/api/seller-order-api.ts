import type { DeliveryStatus } from '@/shared/config'
import { apiClient, expectShape, type Page } from '@/shared/api'
import type { DeliveryDto, SellerOrderDto, ShipRequestDto } from './seller-order.dto'
import { deliveryShape, sellerOrderPageShape } from './seller-order.shape'

export const sellerOrderApi = {
  /**
   * 판매 주문(배송 단위) 최근 것부터 (page는 0부터, 기본 20건).
   * status(BE #1280)는 배송 상태 하나로 거르고 totalElements가 그 상태의 전체 건수. null이면 보내지 않는다(전체)
   */
  list: (page = 0, status: DeliveryStatus | null = null, size = 20) =>
    apiClient
      .get<Page<SellerOrderDto>>('/seller/orders', {
        params: { page, size, ...(status && { status }) },
      })
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
