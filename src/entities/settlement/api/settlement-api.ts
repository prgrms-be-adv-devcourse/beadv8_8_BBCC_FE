import { apiClient, type Page } from '@/shared/api'
import type {
  SettlementDetailDto,
  SettlementDto,
  SettlementRunRequestDto,
  SettlementRunResultDto,
  SettlementTargetDto,
} from './settlement.dto'

export const settlementApi = {
  targets: () =>
    apiClient
      .get<SettlementTargetDto[]>('/seller/settlement-targets')
      .then((response) => response.data),
  list: () =>
    apiClient
      .get<Page<SettlementDto>>('/seller/settlements', { params: { page: 0, size: 20 } })
      .then((response) => response.data),
  get: (settlementId: string) =>
    apiClient
      .get<SettlementDetailDto>(`/seller/settlements/${settlementId}`)
      .then((response) => response.data),
  /** 시연용 수동 실행 */
  run: (request: SettlementRunRequestDto) =>
    apiClient
      .post<SettlementRunResultDto>('/admin/settlements/run', request)
      .then((response) => response.data),
}
