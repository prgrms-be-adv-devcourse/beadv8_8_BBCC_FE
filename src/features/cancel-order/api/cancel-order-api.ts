import { orderDetailShape } from '@/entities/order'
import { apiClient, expectShape } from '@/shared/api'

/** POST /orders/{orderId}/cancel (BE #354): 본문 없음, 응답은 취소된 주문 상세. 하나라도 발송했으면 409, 이미 취소면 그대로 200 */
export const cancelOrderApi = {
  cancel: (orderId: string) =>
    apiClient
      .post(`/orders/${orderId}/cancel`)
      .then(expectShape(orderDetailShape))
      .then(() => undefined),
}
