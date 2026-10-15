import { apiClient, expectShape, type Page } from '@/shared/api'
import type {
  SettlementDetailDto,
  SettlementDto,
  SettlementRunRequestDto,
  SettlementRunResultDto,
  SettlementTargetDto,
} from './settlement.dto'
import {
  settlementDetailShape,
  settlementPageShape,
  settlementRunShape,
  settlementTargetPageShape,
} from './settlement.shape'

export const settlementApi = {
  /** 아직 정산 안 된 구매확정분 */
  targets: () =>
    apiClient
      .get<Page<SettlementTargetDto>>('/seller/settlement-targets', {
        params: { page: 0, size: 50 },
      })
      .then(expectShape(settlementTargetPageShape)),
  list: () =>
    apiClient
      .get<Page<SettlementDto>>('/seller/settlements', { params: { page: 0, size: 20 } })
      .then(expectShape(settlementPageShape)),
  get: (settlementId: string) =>
    apiClient
      .get<SettlementDetailDto>(`/seller/settlements/${settlementId}`)
      .then(expectShape(settlementDetailShape)),
  /** 시연용 수동 실행 (끝날 때까지 기다린다). 이미 정산한 기준일 · 실행 중이면 409 */
  run: (request: SettlementRunRequestDto) =>
    apiClient
      .post<SettlementRunResultDto>('/admin/settlements/run', request)
      .then(expectShape(settlementRunShape)),
}
