import { useQuery } from '@tanstack/react-query'
import { orderOpsApi } from '../api/order-ops-api'
import { toEventFailure, toPaymentRecovery, toQuarantinedOutbox } from './failure'
import { toStuckOrder, toStuckSummary } from './stuck-order'

export const orderOpsKeys = {
  all: ['order-ops'] as const,
  stuckSummary: ['order-ops', 'stuck', 'summary'] as const,
  stuck: (kind: string, page: number) => ['order-ops', 'stuck', kind, page] as const,
  recoveries: (status: string | null, page: number) =>
    ['order-ops', 'recoveries', status, page] as const,
  eventFailures: (status: string | null, page: number) =>
    ['order-ops', 'event-failures', status, page] as const,
  outbox: (page: number) => ['order-ops', 'outbox', page] as const,
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

export function usePaymentRecoveriesQuery(status: string | null, page: number) {
  return useQuery({
    queryKey: orderOpsKeys.recoveries(status, page),
    queryFn: () => orderOpsApi.recoveries(status, page),
    select: (data) => ({ ...data, content: data.content.map(toPaymentRecovery) }),
  })
}

export function useEventFailuresQuery(status: string | null, page: number) {
  return useQuery({
    queryKey: orderOpsKeys.eventFailures(status, page),
    queryFn: () => orderOpsApi.eventFailures(status, page),
    select: (data) => ({ ...data, content: data.content.map(toEventFailure) }),
  })
}

export function useQuarantinedOutboxQuery(page: number) {
  return useQuery({
    queryKey: orderOpsKeys.outbox(page),
    queryFn: () => orderOpsApi.quarantinedOutbox(page),
    select: (data) => ({ ...data, content: data.content.map(toQuarantinedOutbox) }),
  })
}
