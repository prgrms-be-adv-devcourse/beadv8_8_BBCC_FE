import { registerMockHandlers, registerMockObservers } from '@/shared/api'
import { adminHandlers } from './admin-handlers'
import { memberHandlers } from './member-handlers'
import { productHandlers, productObservers } from './product-handlers'
import { recommendationHandlers } from './recommendation-handlers'
import { settlementHandlers } from './settlement-handlers'

/**
 * 백엔드에 아직 없는 API만 목으로 응답한다 (실제 응답을 목 저장소에 옮겨 적는 관찰자도 함께). 도메인마다 흐름 패널에서 켜고 끌 수 있고,
 * 실제 API가 생기면 패널에서 끄고 확인한 뒤 핸들러를 뺀다
 */
export function setupMocks() {
  registerMockHandlers('상품', productHandlers)
  registerMockObservers('상품', productObservers)
  registerMockHandlers('추천', recommendationHandlers)
  registerMockHandlers('정산', settlementHandlers)
  registerMockHandlers('회원 보완 (탈퇴 · 이력 · 판매자 정보)', memberHandlers)
  registerMockHandlers('관리자 전체 조회', adminHandlers)
}
