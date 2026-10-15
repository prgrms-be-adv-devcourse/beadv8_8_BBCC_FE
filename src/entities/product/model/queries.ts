import { useQuery } from '@tanstack/react-query'
import { productApi } from '../api/product-api'
import type { ProductSearch } from './product'
import { toProductDetail, toProductSearchParams, toProductSummary } from './product.mapper'

export const productKeys = {
  all: ['products'] as const,
  list: ['products', 'list'] as const,
  search: (search: ProductSearch) => ['products', 'list', search] as const,
  detail: (productId: string) => ['products', 'detail', productId] as const,
  sellerList: ['products', 'seller'] as const,
}

const NO_SEARCH: ProductSearch = { keyword: '', categoryId: null }

/** 판매 중인 상품 (검색어 · 카테고리) */
export function useProductsQuery(search: ProductSearch = NO_SEARCH) {
  return useQuery({
    queryKey: productKeys.search(search),
    queryFn: () => productApi.list(toProductSearchParams(search)),
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
