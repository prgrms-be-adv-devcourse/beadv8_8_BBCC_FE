import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { sellerOrderApi } from '../api/seller-order-api'
import { toSellerOrder } from './seller-order.mapper'

export const sellerOrderKeys = {
  list: ['seller-orders'] as const,
  listPage: (page: number) => ['seller-orders', page] as const,
}

/** 판매 주문 한 페이지 (page는 0부터, 기본 첫 페이지) */
export function useSellerOrdersQuery(page = 0) {
  return useQuery({
    queryKey: sellerOrderKeys.listPage(page),
    queryFn: () => sellerOrderApi.list(page),
    placeholderData: keepPreviousData,
    select: (page) => ({ ...page, content: page.content.map(toSellerOrder) }),
  })
}
