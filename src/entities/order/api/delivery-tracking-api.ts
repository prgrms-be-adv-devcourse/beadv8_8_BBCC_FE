import { apiClient, expectShape } from '@/shared/api'
import type { DeliveryTrackingDto } from './delivery-tracking.dto'
import { deliveryTrackingShape } from './delivery-tracking.shape'

export const deliveryTrackingApi = {
  /** 구매자만. 404 남의 주문 · 없는 배송, 409 발송 전 · 조회 못 하는 택배사, 503 택배 조회 불가 */
  get: (orderId: string, deliveryId: string) =>
    apiClient
      .get<DeliveryTrackingDto>(`/orders/${orderId}/deliveries/${deliveryId}/tracking`)
      .then(expectShape(deliveryTrackingShape)),
}
