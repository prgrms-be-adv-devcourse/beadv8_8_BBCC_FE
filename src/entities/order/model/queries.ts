import { useQuery } from '@tanstack/react-query'
import { orderApi } from '../api/order-api'
import { toOrder, toOrderSummary } from './order.mapper'
import { isAwaitingPayment } from './order.rules'

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

/** 결제 처리 중이면 1초마다 다시 조회한다 (주문하기는 결과를 주지 않고 서버 이벤트로 이어서 처리된다) */
export function useOrderQuery(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => orderApi.get(orderId),
    select: toOrder,
    refetchInterval: (query) =>
      query.state.data && isAwaitingPayment(toOrder(query.state.data)) ? 1000 : false,
  })
}
