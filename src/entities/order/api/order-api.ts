import { apiClient, type Page } from '@/shared/api'
import type { OrderDetailDto, OrderSummaryDto, PlaceOrderRequestDto } from './order.dto'

export const orderApi = {
  list: () =>
    apiClient
      .get<Page<OrderSummaryDto>>('/orders', { params: { page: 0, size: 20 } })
      .then((response) => response.data),
  get: (orderId: string) =>
    apiClient.get<OrderDetailDto>(`/orders/${orderId}`).then((response) => response.data),
  /** 201 + PENDING_PAYMENT. 결과는 주문 상세를 다시 조회해 확인한다 */
  place: (request: PlaceOrderRequestDto) =>
    apiClient.post<OrderDetailDto>('/orders', request).then((response) => response.data),
  /** 이미 확정이어도 200, 배송 완료 전이면 409 */
  confirmItem: (orderId: string, orderItemId: string) =>
    apiClient.post(`/orders/${orderId}/items/${orderItemId}/confirm`),
}
