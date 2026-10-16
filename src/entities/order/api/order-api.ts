import { apiClient, expectShape, type Page } from '@/shared/api'
import type {
  AdminOrderDto,
  OrderDetailDto,
  OrderSummaryDto,
  PlaceOrderRequestDto,
} from './order.dto'
import { adminOrderPageShape, orderDetailShape, orderPageShape } from './order.shape'

export const orderApi = {
  list: () =>
    apiClient
      .get<Page<OrderSummaryDto>>('/orders', { params: { page: 0, size: 20 } })
      .then(expectShape(orderPageShape)),
  get: (orderId: string) =>
    apiClient.get<OrderDetailDto>(`/orders/${orderId}`).then(expectShape(orderDetailShape)),
  /**
   * 201 + PENDING_PAYMENT. 결과는 주문 상세를 다시 조회해 확인한다.
   * 멱등키(BE #351): 같은 키 · 같은 내용이면 200 + 기존 주문(그 시점 상태), 같은 키 · 다른 내용이면 409
   */
  place: (request: PlaceOrderRequestDto, idempotencyKey: string) =>
    apiClient
      .post<OrderDetailDto>('/orders', request, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
      .then(expectShape(orderDetailShape)),
  /** 이미 확정이어도 200, 배송 완료 전이면 409 */
  confirmItem: (orderId: string, orderItemId: string) =>
    apiClient.post(`/orders/${orderId}/items/${orderItemId}/confirm`),
  /** 관리자 전체 주문 (기획서 8장 보완). 백엔드에 아직 없어 목 응답이다 */
  /** 최근 주문부터 (BE는 상태로 거르지 않는다 → 화면에서 거른다) */
  adminList: () =>
    apiClient
      .get<Page<AdminOrderDto>>('/admin/orders', { params: { page: 0, size: 100 } })
      .then(expectShape(adminOrderPageShape)),
}
