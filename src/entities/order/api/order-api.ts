import { useQuery } from '@tanstack/react-query'
import { apiClient, type Page } from '@/shared/api'
import type { OrderDetail, OrderSummary } from '../model/types'

export const orderKeys = {
  list: ['orders', 'list'] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
}

export const orderApi = {
  list: () =>
    apiClient
      .get<Page<OrderSummary>>('/orders', { params: { page: 0, size: 20 } })
      .then((response) => response.data),
  get: (orderId: string) =>
    apiClient.get<OrderDetail>(`/orders/${orderId}`).then((response) => response.data),
}

export function useOrdersQuery() {
  return useQuery({ queryKey: orderKeys.list, queryFn: orderApi.list })
}

/** 결제 처리 중이면 1초마다 다시 조회한다 (주문하기는 결과를 주지 않고, 서버 이벤트로 이어서 처리된다) */
export function useOrderQuery(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => orderApi.get(orderId),
    refetchInterval: (query) => (query.state.data?.status === 'PENDING_PAYMENT' ? 1000 : false),
  })
}
