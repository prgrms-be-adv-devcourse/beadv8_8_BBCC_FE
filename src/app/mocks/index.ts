import { registerMockHandlers } from '@/shared/api'
import { paymentHandlers } from './payment-handlers'
import { productHandlers } from './product-handlers'
import { recommendationHandlers } from './recommendation-handlers'
import { settlementHandlers } from './settlement-handlers'

/** 백엔드에 아직 없는 API(상품 · 추천 · 정산 · 충전 취소)만 목으로 응답한다. 실제 API가 생기면 해당 핸들러를 뺀다 */
export function setupMocks() {
  registerMockHandlers([
    ...recommendationHandlers,
    ...productHandlers,
    ...settlementHandlers,
    ...paymentHandlers,
  ])
}
