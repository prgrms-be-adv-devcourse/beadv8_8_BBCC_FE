import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { settlementApi } from '../api/settlement-api'
import { toSettlement, toSettlementDetail, toSettlementTarget } from './settlement.mapper'

export const settlementKeys = {
  all: ['settlement'] as const,
  targets: ['settlement', 'targets'] as const,
  targetsPage: (page: number) => ['settlement', 'targets', page] as const,
  targetSummary: ['settlement', 'targets', 'summary'] as const,
  list: ['settlement', 'list'] as const,
  listPage: (page: number) => ['settlement', 'list', page] as const,
  detail: (settlementId: string) => ['settlement', 'detail', settlementId] as const,
}

/** 정산 예정 (50건씩, page는 0부터). 쪽을 넘기는 동안 앞 쪽을 보여 준다 */
export function useSettlementTargetsQuery(page = 0) {
  return useQuery({
    queryKey: settlementKeys.targetsPage(page),
    queryFn: () => settlementApi.targets(page),
    select: (result) => ({ ...result, content: result.content.map(toSettlementTarget) }),
    placeholderData: keepPreviousData,
  })
}

/** 정산 예정 금액(수수료 빼기 전) */
export function useSettlementTargetSummaryQuery() {
  return useQuery({
    queryKey: settlementKeys.targetSummary,
    queryFn: settlementApi.targetSummary,
    select: (summary) => summary.totalSalesAmount,
  })
}

/** 정산서 (최신순 20건씩, page는 0부터). 쪽을 넘기는 동안 앞 쪽을 보여 준다 */
export function useSettlementsQuery(page = 0) {
  return useQuery({
    queryKey: settlementKeys.listPage(page),
    queryFn: () => settlementApi.list(page),
    select: (result) => ({ ...result, content: result.content.map(toSettlement) }),
    placeholderData: keepPreviousData,
  })
}

export function useSettlementQuery(settlementId: string | null) {
  return useQuery({
    queryKey: settlementKeys.detail(settlementId ?? ''),
    queryFn: () => settlementApi.get(settlementId!),
    select: toSettlementDetail,
    enabled: settlementId !== null,
  })
}
