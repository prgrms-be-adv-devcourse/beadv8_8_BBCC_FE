import { useQuery } from '@tanstack/react-query'
import { productApi } from '../api/product-api'
import { toProductDetail, toProductSummary } from './product.mapper'

export const productKeys = {
  all: ['products'] as const,
  list: ['products', 'list'] as const,
  detail: (productId: string) => ['products', 'detail', productId] as const,
  sellerList: ['products', 'seller'] as const,
}

export function useProductsQuery() {
  return useQuery({
    queryKey: productKeys.list,
    queryFn: productApi.list,
    select: (page) => ({ ...page, content: page.content.map(toProductSummary) }),
  })
}

export function useProductQuery(productId: string) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => productApi.get(productId),
    select: toProductDetail,
  })
}

export function useSellerProductsQuery() {
  return useQuery({
    queryKey: productKeys.sellerList,
    queryFn: productApi.sellerList,
    select: (page) => ({ ...page, content: page.content.map(toProductDetail) }),
  })
}
