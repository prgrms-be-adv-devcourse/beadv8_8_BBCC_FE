import { useQuery } from '@tanstack/react-query'
import { adminSettlementApi } from '../api/admin-settlement-api'
import { toAdminSettlement } from './admin-settlement.mapper'
import type { SettlementStatus } from './settlement'
import { toSettlementRunResult } from './settlement.mapper'

// settlementKeys.all 아래에 둔다 → 정산 실행 · 재요청이 무효화하면 같이 새로 받는다
export const adminSettlementKeys = {
  list: (status: SettlementStatus | null, page: number) =>
    ['settlement', 'admin', status, page] as const,
  run: (runId: string) => ['settlement', 'run', runId] as const,
}

export function useAdminSettlementsQuery(status: SettlementStatus | null, page: number) {
  return useQuery({
    queryKey: adminSettlementKeys.list(status, page),
    queryFn: () => adminSettlementApi.list(status, page),
    select: (data) => ({ ...data, content: data.content.map(toAdminSettlement) }),
  })
}

export function useSettlementRunQuery(runId: string | null) {
  return useQuery({
    queryKey: adminSettlementKeys.run(runId ?? ''),
    queryFn: () => adminSettlementApi.run(runId!),
    select: toSettlementRunResult,
    enabled: runId !== null,
  })
}
