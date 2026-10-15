import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { productApi } from '../api/product-api'
import type { ProductDetailDto, ProductSummaryDto, SellerProductDto } from '../api/product.dto'
import type { Page } from '@/shared/api'
import type { Category, ProductSearch } from './product'
import {
  toCategories,
  toCategoryInputs,
  toProductDetail,
  toProductSearchParams,
  toProductSummary,
  toSellerProduct,
} from './product.mapper'

export const productKeys = {
  all: ['products'] as const,
  list: ['products', 'list'] as const,
  search: (search: ProductSearch) => ['products', 'list', search] as const,
  detail: (productId: string) => ['products', 'detail', productId] as const,
  sellerList: ['products', 'seller'] as const,
  categories: ['products', 'categories'] as const,
  categoryInputs: (categoryId: string) => ['products', 'category-inputs', categoryId] as const,
}

const NO_CATEGORIES: Category[] = []

/** 카테고리는 거의 바뀌지 않아 한 번만 불러온다 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: productApi.categories,
    select: (tree) => toCategories(tree),
    staleTime: Infinity,
  })
}

/** 카테고리 이름은 상품 응답에 없어 카테고리 트리에서 찾는다 */
function useCategoryList(): Category[] {
  return useCategoriesQuery().data ?? NO_CATEGORIES
}

/** 등록 폼 구성 (카테고리를 고르면 불러온다) */
export function useCategoryInputsQuery(categoryId: string) {
  return useQuery({
    queryKey: productKeys.categoryInputs(categoryId),
    queryFn: () => productApi.categoryInputs(categoryId),
    select: toCategoryInputs,
    enabled: !!categoryId,
    staleTime: Infinity,
  })
}

const NO_SEARCH: ProductSearch = { keyword: '', categoryId: null }

/** (목) 판매 중인 상품 (검색어 · 카테고리) */
export function useProductsQuery(search: ProductSearch = NO_SEARCH) {
  const categories = useCategoryList()
  return useQuery({
    queryKey: productKeys.search(search),
    queryFn: () => productApi.list(toProductSearchParams(search)),
    select: useCallback(
      (page: Page<ProductSummaryDto>) => ({
        ...page,
        content: page.content.map((item) => toProductSummary(item, categories)),
      }),
      [categories],
    ),
  })
}

export function useProductQuery(productId: string) {
  const categories = useCategoryList()
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => productApi.get(productId),
    select: useCallback((dto: ProductDetailDto) => toProductDetail(dto, categories), [categories]),
  })
}

/** (목) 내 상품 */
export function useSellerProductsQuery() {
  const categories = useCategoryList()
  return useQuery({
    queryKey: productKeys.sellerList,
    queryFn: productApi.sellerList,
    select: useCallback(
      (page: Page<SellerProductDto>) => ({
        ...page,
        content: page.content.map((item) => toSellerProduct(item, categories)),
      }),
      [categories],
    ),
  })
}
