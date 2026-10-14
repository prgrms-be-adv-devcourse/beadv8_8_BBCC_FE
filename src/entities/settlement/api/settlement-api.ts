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
  settlementShape,
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
  /** 관리자 판매자별 정산 조회 (기획서 8장 보완). 백엔드에 아직 없어 목 응답이다 */
  adminList: () =>
    apiClient
      .get<Page<SettlementDto>>('/admin/settlements', { params: { page: 0, size: 50 } })
      .then(expectShape(settlementPageShape)),
  /** 실패 정산 재처리 (목). 같은 settlementId로 다시 적립 요청 */
  retry: (settlementId: string) =>
    apiClient
      .post<SettlementDto>(`/admin/settlements/${settlementId}/retry`)
      .then(expectShape(settlementShape)),
  /** 시연용 수동 실행 */
  run: (request: SettlementRunRequestDto) =>
    apiClient
      .post<SettlementRunResultDto>('/admin/settlements/run', request)
      .then(expectShape(settlementRunShape)),
}
