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
  settlementTargetsShape,
} from './settlement.shape'

export const settlementApi = {
  targets: () =>
    apiClient
      .get<SettlementTargetDto[]>('/seller/settlement-targets')
      .then(expectShape(settlementTargetsShape)),
  list: () =>
    apiClient
      .get<Page<SettlementDto>>('/seller/settlements', { params: { page: 0, size: 20 } })
      .then(expectShape(settlementPageShape)),
  get: (settlementId: string) =>
    apiClient
      .get<SettlementDetailDto>(`/seller/settlements/${settlementId}`)
      .then(expectShape(settlementDetailShape)),
  /** 시연용 수동 실행 */
  run: (request: SettlementRunRequestDto) =>
    apiClient
      .post<SettlementRunResultDto>('/admin/settlements/run', request)
      .then(expectShape(settlementRunShape)),
}
