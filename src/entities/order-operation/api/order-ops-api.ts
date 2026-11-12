import { apiClient, expectShape, type Page } from '@/shared/api'
import type {
  EventFailureDto,
  PaymentRecoveryDto,
  QuarantinedOutboxDto,
  StuckOrderDto,
  StuckSummaryDto,
} from './order-ops.dto'
import {
  eventFailurePageShape,
  paymentRecoveryPageShape,
  quarantinedOutboxPageShape,
  stuckOrderPageShape,
  stuckSummaryShape,
} from './order-ops.shape'

const BASE = '/admin/orders'

export const orderOpsApi = {
  stuckSummary: () =>
    apiClient.get<StuckSummaryDto>(`${BASE}/stuck/summary`).then(expectShape(stuckSummaryShape)),
  /** 오래된 것부터. kind는 필수(모르는 값 400) */
  stuck: (kind: string, page: number, size = 20) =>
    apiClient
      .get<Page<StuckOrderDto>>(`${BASE}/stuck`, { params: { kind, page, size } })
      .then(expectShape(stuckOrderPageShape)),
  /** 결제 완료 반영 실패: 최근 기록부터, status를 주면 그 상태만 */
  recoveries: (status: string | null, page: number, size = 20) =>
    apiClient
      .get<Page<PaymentRecoveryDto>>(`${BASE}/recoveries`, {
        params: { status: status ?? undefined, page, size },
      })
      .then(expectShape(paymentRecoveryPageShape)),
  /** 받은 이벤트 처리 실패: 최근 기록부터, status를 주면 그 상태만 */
  eventFailures: (status: string | null, page: number, size = 20) =>
    apiClient
      .get<Page<EventFailureDto>>(`${BASE}/event-failures`, {
        params: { status: status ?? undefined, page, size },
      })
      .then(expectShape(eventFailurePageShape)),
  /** 보내지 못하고 격리된 아웃박스 */
  quarantinedOutbox: (page: number, size = 20) =>
    apiClient
      .get<Page<QuarantinedOutboxDto>>(`${BASE}/outbox/quarantined`, { params: { page, size } })
      .then(expectShape(quarantinedOutboxPageShape)),
}
