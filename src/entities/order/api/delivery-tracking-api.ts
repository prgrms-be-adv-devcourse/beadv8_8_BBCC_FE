import { apiClient, expectShape } from '@/shared/api'
import type { DeliveryTrackingDto } from './delivery-tracking.dto'
import { deliveryTrackingShape } from './delivery-tracking.shape'

export const deliveryTrackingApi = {
  /** 구매자만. 404 남의 주문 · 없는 배송, 503 택배 조회 불가. 운송장 없음 · 조회 못 하는 택배사는 200 + 빈 이력 */
  get: (orderId: string, deliveryId: string) =>
    apiClient
      .get<DeliveryTrackingDto>(`/orders/${orderId}/deliveries/${deliveryId}/tracking`)
      .then(expectShape(deliveryTrackingShape)),
}
