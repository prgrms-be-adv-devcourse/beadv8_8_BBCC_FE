import { registerMockHandlers } from '@/shared/api'
import { adminHandlers } from './admin-handlers'
import { memberHandlers } from './member-handlers'
import { productHandlers } from './product-handlers'
import { recommendationHandlers } from './recommendation-handlers'
import { settlementHandlers } from './settlement-handlers'
import { walletHandlers } from './wallet-handlers'

/**
 * 백엔드에 아직 없는 API만 목으로 응답한다. 도메인마다 흐름 패널에서 켜고 끌 수 있고,
 * 실제 API가 생기면 패널에서 끄고 확인한 뒤 핸들러를 뺀다
 */
export function setupMocks() {
  registerMockHandlers('상품', productHandlers)
  registerMockHandlers('추천', recommendationHandlers)
  registerMockHandlers('정산', settlementHandlers)
  registerMockHandlers('회원 보완 (탈퇴 · 이력 · 판매자 정보)', memberHandlers)
  registerMockHandlers('관리자 전체 조회', adminHandlers)
  registerMockHandlers('예치금 거래 내역', walletHandlers)
}
