import { useQuery } from '@tanstack/react-query'
import { apiClient, type Page } from '@/shared/api'
import type { ProductDetail, ProductSummary } from '../model/types'

export const productKeys = {
  list: ['products', 'list'] as const,
  detail: (productId: string) => ['products', 'detail', productId] as const,
  sellerList: ['products', 'seller'] as const,
}

export const productApi = {
  list: () =>
    apiClient
      .get<Page<ProductSummary>>('/products', { params: { page: 0, size: 20 } })
      .then((response) => response.data),
  get: (productId: string) =>
    apiClient.get<ProductDetail>(`/products/${productId}`).then((response) => response.data),
  /** 판매자 내 상품 목록 */
  sellerList: () =>
    apiClient
      .get<Page<ProductDetail>>('/seller/products', { params: { page: 0, size: 20 } })
      .then((response) => response.data),
}

export function useProductsQuery() {
  return useQuery({ queryKey: productKeys.list, queryFn: productApi.list })
}

export function useProductQuery(productId: string) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => productApi.get(productId),
  })
}

export function useSellerProductsQuery() {
  return useQuery({ queryKey: productKeys.sellerList, queryFn: productApi.sellerList })
}
