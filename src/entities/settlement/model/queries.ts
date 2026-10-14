import { useQuery } from '@tanstack/react-query'
import { settlementApi } from '../api/settlement-api'
import { toSettlement, toSettlementDetail, toSettlementTarget } from './settlement.mapper'

export const settlementKeys = {
  all: ['settlement'] as const,
  targets: ['settlement', 'targets'] as const,
  list: ['settlement', 'list'] as const,
  detail: (settlementId: string) => ['settlement', 'detail', settlementId] as const,
}

export function useSettlementTargetsQuery() {
  return useQuery({
    queryKey: settlementKeys.targets,
    queryFn: settlementApi.targets,
    select: (list) => list.map(toSettlementTarget),
  })
}

export function useSettlementsQuery() {
  return useQuery({
    queryKey: settlementKeys.list,
    queryFn: settlementApi.list,
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

export function useAdminSettlementsQuery() {
  return useQuery({
    queryKey: ['settlement', 'admin'] as const,
    queryFn: settlementApi.adminList,
    select: (page) => page.content.map(toSettlement),
  })
}
