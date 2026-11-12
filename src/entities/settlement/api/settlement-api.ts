import { apiClient, expectShape, type Page } from '@/shared/api'
import type {
  SettlementDetailDto,
  SettlementDto,
  SettlementRunRequestDto,
  SettlementRunResultDto,
  SettlementTargetDto,
  SettlementTargetSummaryDto,
} from './settlement.dto'
import {
  settlementDetailShape,
  settlementPageShape,
  settlementRunShape,
  settlementTargetPageShape,
  settlementTargetSummaryShape,
} from './settlement.shape'

export const settlementApi = {
  /** 아직 정산 안 된 구매확정분 (50건씩). page는 0부터 */
  targets: (page = 0) =>
    apiClient
      .get<Page<SettlementTargetDto>>('/seller/settlement-targets', {
        params: { page, size: 50 },
      })
      .then(expectShape(settlementTargetPageShape)),
  /** 아직 정산 안 된 구매확정분 전체 합 (목록 페이지와 상관없이) */
  targetSummary: () =>
    apiClient
      .get<SettlementTargetSummaryDto>('/seller/settlement-targets/summary')
      .then(expectShape(settlementTargetSummaryShape)),
  /** 내 정산서 (최신순 20건씩). page는 0부터 */
  list: (page = 0) =>
    apiClient
      .get<Page<SettlementDto>>('/seller/settlements', { params: { page, size: 20 } })
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
