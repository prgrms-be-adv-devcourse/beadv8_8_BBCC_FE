import { apiClient, expectShape, type Page } from '@/shared/api'
import type { OrderDeadLetterDto, OrderDeadLetterSummaryDto } from './order-dead-letter.dto'
import { orderDeadLetterPageShape, orderDeadLetterShape } from './order-dead-letter.shape'

const ORDER_DEAD_LETTERS_PATH = '/admin/orders/dead-letters'

export const orderDeadLetterApi = {
  /** 결제 토픽에서 온 것이 먼저, 그 안은 최근 받은 것부터 */
  list: (status: string, page: number) =>
    apiClient
      .get<Page<OrderDeadLetterSummaryDto>>(ORDER_DEAD_LETTERS_PATH, {
        params: { status, page, size: 20 },
      })
      .then(expectShape(orderDeadLetterPageShape)),
  get: (deadLetterId: string) =>
    apiClient
      .get<OrderDeadLetterDto>(`${ORDER_DEAD_LETTERS_PATH}/${deadLetterId}`)
      .then(expectShape(orderDeadLetterShape)),
  /** 성공 REPROCESSED · 다시 실패 OPEN(횟수 · 이유 기록) · 이미 재처리 그대로, 모두 200. 종료됐거나 처리 중이면 409 */
  reprocess: (deadLetterId: string) =>
    apiClient
      .post<OrderDeadLetterDto>(`${ORDER_DEAD_LETTERS_PATH}/${deadLetterId}/reprocess`)
      .then(expectShape(orderDeadLetterShape)),
  /** 처리하지 않고 확인 후 종료 (메모 필수 · 500자). 이미 종료면 그대로 200, 재처리됐으면 409 */
  close: (deadLetterId: string, memo: string) =>
    apiClient
      .post<OrderDeadLetterDto>(`${ORDER_DEAD_LETTERS_PATH}/${deadLetterId}/close`, { memo })
      .then(expectShape(orderDeadLetterShape)),
}
