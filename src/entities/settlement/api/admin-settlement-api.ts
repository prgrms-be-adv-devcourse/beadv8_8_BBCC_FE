import { apiClient, expectShape, type Page } from '@/shared/api'
import type { AdminSettlementDto } from './admin-settlement.dto'
import { adminSettlementPageShape } from './admin-settlement.shape'
import type { SettlementRunResultDto } from './settlement.dto'
import { settlementRunShape } from './settlement.shape'

export const adminSettlementApi = {
  /** 모든 판매자의 정산서. status를 빼면 모든 상태 */
  list: (status: string | null, page: number) =>
    apiClient
      .get<Page<AdminSettlementDto>>('/admin/settlements', {
        params: { status: status ?? undefined, page, size: 20 },
      })
      .then(expectShape(adminSettlementPageShape)),
  /** 지급 결과를 받지 못한 정산서(COMPLETED)만 같은 정산서로 지급을 다시 요청한다 (204, 그 밖의 상태는 409) */
  retry: (settlementId: string) =>
    apiClient.post<void>(`/admin/settlements/${settlementId}/retry`).then(() => undefined),
  run: (runId: string) =>
    apiClient
      .get<SettlementRunResultDto>(`/admin/settlement-runs/${runId}`)
      .then(expectShape(settlementRunShape)),
  /** 실행 중으로 남은 실행을 실패로 정리한다 (200 실행 결과, 실행 중이 아니면 409) */
  recover: (runId: string) =>
    apiClient
      .post<SettlementRunResultDto>(`/admin/settlement-runs/${runId}/recover`)
      .then(expectShape(settlementRunShape)),
}
