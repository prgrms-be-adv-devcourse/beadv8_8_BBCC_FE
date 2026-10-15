import { useQuery } from '@tanstack/react-query'
import { orderApi } from '../api/order-api'
import { toAdminOrder, toOrder, toOrderSummary } from './order.mapper'
import { isAwaitingPayment, paymentPollInterval } from './order.rules'

export const orderKeys = {
  list: ['orders', 'list'] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
}

export function useOrdersQuery() {
  return useQuery({
    queryKey: orderKeys.list,
    queryFn: orderApi.list,
    select: (page) => ({ ...page, content: page.content.map(toOrderSummary) }),
  })
}

/** 주문별로 결제 처리 중을 처음 본 시각 (이 탭 기준) */
const pendingSince = new Map<string, number>()

/** at(보통 query.dataUpdatedAt) 기준으로 결제 처리 중이 얼마나 이어졌는지 (ms). 처리 중이 아니면 0 */
export function paymentPendingMs(orderId: string, at: number): number {
  const since = pendingSince.get(orderId)
  return since === undefined ? 0 : Math.max(0, at - since)
}

/**
 * 결제 처리 중이면 다시 조회한다 (주문하기는 결과를 주지 않고 서버 이벤트로 이어서 처리된다).
 * 처음 30초는 1초마다, 그 뒤는 10초마다 (서버 이벤트가 오지 않을 때 조회가 흐름 기록을 덮지 않게)
 */
export function useOrderQuery(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => orderApi.get(orderId),
    select: toOrder,
    refetchInterval: (query) => {
      const { data, dataUpdatedAt } = query.state
      if (!data || !isAwaitingPayment(toOrder(data))) {
        pendingSince.delete(orderId)
        return false
      }
      if (!pendingSince.has(orderId)) pendingSince.set(orderId, dataUpdatedAt)
      return paymentPollInterval(paymentPendingMs(orderId, dataUpdatedAt))
    },
  })
}

export function useAdminOrdersQuery(status: string | null) {
  return useQuery({
    queryKey: ['orders', 'admin'] as const,
    queryFn: () => orderApi.adminList(),
    // BE는 상태로 거르지 않는다 (최근 100건 안에서 화면이 거른다)
    select: (page) => ({
      ...page,
      content: page.content
        .map(toAdminOrder)
        .filter((order) => status === null || order.status === status),
    }),
  })
}
