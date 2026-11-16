import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { settlementApi } from '../api/settlement-api'
import { toSettlement, toSettlementDetail, toSettlementTarget } from './settlement.mapper'

export const settlementKeys = {
  all: ['settlement'] as const,
  targets: (page: number) => ['settlement', 'targets', page] as const,
  targetSummary: ['settlement', 'targets', 'summary'] as const,
  list: (page: number) => ['settlement', 'list', page] as const,
  detail: (settlementId: string) => ['settlement', 'detail', settlementId] as const,
}

/** 정산 예정 한 페이지 (page는 0부터, 50건씩) */
export function useSettlementTargetsQuery(page = 0) {
  return useQuery({
    queryKey: settlementKeys.targets(page),
    queryFn: () => settlementApi.targets(page),
    placeholderData: keepPreviousData,
    select: (page) => ({ ...page, content: page.content.map(toSettlementTarget) }),
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

/** 정산서 한 페이지 (page는 0부터, 20건씩) */
export function useSettlementsQuery(page = 0) {
  return useQuery({
    queryKey: settlementKeys.list(page),
    queryFn: () => settlementApi.list(page),
    placeholderData: keepPreviousData,
    select: (page) => ({ ...page, content: page.content.map(toSettlement) }),
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
