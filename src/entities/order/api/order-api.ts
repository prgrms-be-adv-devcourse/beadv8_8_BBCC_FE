import { apiClient, expectShape, type Page } from '@/shared/api'
import type { OrderStatus } from '../model/order'
import type {
  AdminOrderDto,
  ChildPurchaseDto,
  OrderDetailDto,
  OrderStatusHistoryDto,
  OrderSummaryDto,
  OrderTimelineDto,
  PlaceOrderRequestDto,
} from './order.dto'
import {
  adminOrderPageShape,
  childPurchasePageShape,
  orderDetailShape,
  orderHistoryShape,
  orderPageShape,
  orderTimelineShape,
} from './order.shape'

export const orderApi = {
  /** 나를 위해 산 상품 (자녀 토큰만, 주문 일시 최신순 · 팀 목록 형식, BE #1000) */
  childPurchases: (page: number, size = 20) =>
    apiClient
      .get<Page<ChildPurchaseDto>>('/orders/items/mine', {
        params: { page, size },
        principal: 'child',
      })
      .then(expectShape(childPurchasePageShape)),
  /**
   * 최근 주문부터 (page는 0부터, 기본 20건). status(BE #1280)는 주문 상태 하나로 거르고
   * totalElements가 그 상태의 전체 건수. null이면 보내지 않는다(전체)
   */
  list: (page = 0, status: OrderStatus | null = null, size = 20) =>
    apiClient
      .get<Page<OrderSummaryDto>>('/orders', {
        params: { page, size, ...(status && { status }) },
      })
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
  /** 주문 처리 단계 · 시각 (BE #352). 본인 주문만, 아니면 404 */
  timeline: (orderId: string) =>
    apiClient
      .get<OrderTimelineDto>(`/orders/${orderId}/timeline`)
      .then(expectShape(orderTimelineShape)),
  /** 이미 확정이어도 200, 배송 완료 전이면 409 */
  confirmItem: (orderId: string, orderItemId: string) =>
    apiClient.post(`/orders/${orderId}/items/${orderItemId}/confirm`),
  /** 모든 회원의 주문을 최근 주문부터 (size 1~100). status(BE #1280)는 내 주문과 같다 */
  adminList: (page = 0, status: OrderStatus | null = null, size = 100) =>
    apiClient
      .get<Page<AdminOrderDto>>('/admin/orders', {
        params: { page, size, ...(status && { status }) },
      })
      .then(expectShape(adminOrderPageShape)),
  /** 관리자 주문 상태 이력 (BE #442). 오래된 것부터, 주문이 없으면 404 */
  adminHistory: (orderId: string) =>
    apiClient
      .get<OrderStatusHistoryDto[]>(`/admin/orders/${encodeURIComponent(orderId)}/history`)
      .then(expectShape(orderHistoryShape)),
}
