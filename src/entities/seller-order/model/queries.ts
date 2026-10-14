import { useQuery } from '@tanstack/react-query'
import { sellerOrderApi } from '../api/seller-order-api'
import { toSellerOrder } from './seller-order.mapper'

export const sellerOrderKeys = {
  list: ['seller-orders'] as const,
}

export function useSellerOrdersQuery() {
  return useQuery({
    queryKey: sellerOrderKeys.list,
    queryFn: sellerOrderApi.list,
    select: (page) => ({ ...page, content: page.content.map(toSellerOrder) }),
  })
}
