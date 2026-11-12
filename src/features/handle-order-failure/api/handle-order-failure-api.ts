import {
  eventFailureShape,
  paymentRecoveryShape,
  quarantinedOutboxShape,
} from '@/entities/order-operation'
import { apiClient, expectShape } from '@/shared/api'

const BASE = '/admin/orders'

/** 관리자 처리 대기 조치. 모두 본문 없음, 이미 처리된 기록이면 그대로 200 (BE #353 · #449 · #602) */
export const handleOrderFailureApi = {
  /** 결제 완료 반영 다시 하기: 복구되면 RECOVERED, 다시 실패하면 PENDING(시도 수 · 이유 갱신) */
  retryRecovery: (id: string) =>
    apiClient.post(`${BASE}/recoveries/${id}/retry`).then(expectShape(paymentRecoveryShape)),
  /** 주문을 취소해(결제 환불 · 재고 복구) 기록을 종료 */
  cancelRecovery: (id: string) =>
    apiClient.post(`${BASE}/recoveries/${id}/cancel`).then(expectShape(paymentRecoveryShape)),
  /** 받은 이벤트 다시 처리: 복구되면 RECOVERED, 주문이 이미 끝났으면 CANCELLED, 다시 실패하면 PENDING */
  retryEventFailure: (id: string) =>
    apiClient.post(`${BASE}/event-failures/${id}/retry`).then(expectShape(eventFailureShape)),
  /** 기록만 종료(주문은 바꾸지 않음) */
  cancelEventFailure: (id: string) =>
    apiClient.post(`${BASE}/event-failures/${id}/cancel`).then(expectShape(eventFailureShape)),
  /** 격리된 아웃박스를 다시 전송 대기로. 이미 보냈으면 409 */
  retryOutbox: (id: string) =>
    apiClient.post(`${BASE}/outbox/${id}/retry`).then(expectShape(quarantinedOutboxShape)),
}
