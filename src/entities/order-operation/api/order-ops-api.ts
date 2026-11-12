import { apiClient, expectShape, type Page } from '@/shared/api'
import type { StuckOrderDto, StuckSummaryDto } from './order-ops.dto'
import { stuckOrderPageShape, stuckSummaryShape } from './order-ops.shape'

const BASE = '/admin/orders'

export const orderOpsApi = {
  stuckSummary: () =>
    apiClient.get<StuckSummaryDto>(`${BASE}/stuck/summary`).then(expectShape(stuckSummaryShape)),
  /** 오래된 것부터. kind는 필수(모르는 값 400) */
  stuck: (kind: string, page: number, size = 20) =>
    apiClient
      .get<Page<StuckOrderDto>>(`${BASE}/stuck`, { params: { kind, page, size } })
      .then(expectShape(stuckOrderPageShape)),
}
