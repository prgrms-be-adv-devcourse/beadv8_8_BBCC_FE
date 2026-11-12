import { useQuery } from '@tanstack/react-query'
import { orderOpsApi } from '../api/order-ops-api'
import { toStuckOrder, toStuckSummary } from './stuck-order'

export const orderOpsKeys = {
  all: ['order-ops'] as const,
  stuckSummary: ['order-ops', 'stuck', 'summary'] as const,
  stuck: (kind: string, page: number) => ['order-ops', 'stuck', kind, page] as const,
}

export function useStuckSummaryQuery() {
  return useQuery({
    queryKey: orderOpsKeys.stuckSummary,
    queryFn: orderOpsApi.stuckSummary,
    select: toStuckSummary,
  })
}

export function useStuckOrdersQuery(kind: string | null, page: number) {
  return useQuery({
    queryKey: orderOpsKeys.stuck(kind ?? '', page),
    queryFn: () => orderOpsApi.stuck(kind ?? '', page),
    select: (data) => ({ ...data, content: data.content.map(toStuckOrder) }),
    enabled: kind !== null,
  })
}
