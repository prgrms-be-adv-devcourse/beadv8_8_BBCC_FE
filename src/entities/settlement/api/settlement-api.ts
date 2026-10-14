import { useQuery } from '@tanstack/react-query'
import { apiClient, type Page } from '@/shared/api'
import type { Settlement, SettlementTarget } from '../model/types'

export const settlementKeys = {
  targets: ['settlement', 'targets'] as const,
  list: ['settlement', 'list'] as const,
}

export const settlementApi = {
  targets: () =>
    apiClient
      .get<SettlementTarget[]>('/seller/settlement-targets')
      .then((response) => response.data),
  list: () =>
    apiClient
      .get<Page<Settlement>>('/seller/settlements', { params: { page: 0, size: 20 } })
      .then((response) => response.data),
}

export function useSettlementTargetsQuery() {
  return useQuery({ queryKey: settlementKeys.targets, queryFn: settlementApi.targets })
}

export function useSettlementsQuery() {
  return useQuery({ queryKey: settlementKeys.list, queryFn: settlementApi.list })
}
