import { useQuery } from '@tanstack/react-query'
import { apiClient, type Page } from '@/shared/api'
import type { SellerOrder } from '../model/types'

export const sellerOrderKeys = {
  list: ['seller-orders'] as const,
}

export const sellerOrderApi = {
  list: () =>
    apiClient
      .get<Page<SellerOrder>>('/seller/orders', { params: { page: 0, size: 20 } })
      .then((response) => response.data),
}

export function useSellerOrdersQuery() {
  return useQuery({ queryKey: sellerOrderKeys.list, queryFn: sellerOrderApi.list })
}
