import { orderApi, type PlaceOrderInput, toPlaceOrderRequest } from '@/entities/order'
import { wishRequestShape } from '@/entities/wish'
import { apiClient, expectShape } from '@/shared/api'

/** POST /wish/requests/{id}/rejection (BE RejectWishRequest) */
type RejectWishRequestDto = { reason: string }

/**
 * 조르기에는 승인 API가 없다 (BE #999: 승인 = 결제). 승인자는 예약된 칸 cartItemId로 주문하기(POST /orders)를 부르고,
 * 결제가 끝나면 서버가 조르기를 결제 완료(PAID)로 바꾼다. 응답은 결제대기 주문이다
 */
export const decideWishApi = {
  approve: (input: PlaceOrderInput, idempotencyKey: string) =>
    orderApi.place(toPlaceOrderRequest(input), idempotencyKey).then((order) => order.orderId),
  reject: (id: string, request: RejectWishRequestDto) =>
    apiClient
      .post(`/wish/requests/${id}/rejection`, request)
      .then(expectShape(wishRequestShape))
      .then(() => undefined),
}
