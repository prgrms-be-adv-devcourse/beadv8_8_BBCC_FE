import { wishRequestShape } from '@/entities/wish'
import { apiClient, expectShape } from '@/shared/api'

/** POST /wish/requests/{id}/cancellation (BE #968): 보낸 자녀만, 처리 전에만. 본문 없음, 응답은 조르기 한 건 */
export const withdrawChildWishApi = {
  withdraw: (requestId: string) =>
    apiClient
      .post(`/wish/requests/${requestId}/cancellation`, undefined, { principal: 'child' })
      .then(expectShape(wishRequestShape))
      .then(() => undefined),
}
