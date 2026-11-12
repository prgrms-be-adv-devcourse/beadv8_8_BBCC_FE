import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { productApi } from '../api/product-api'
import type { ProductDetailDto, ProductListItemDto } from '../api/product.dto'
import type { Page } from '@/shared/api'
import type { Category, CategoryGender, ProductSearch } from './product'
import {
  productImageUrlOf,
  toCategories,
  toCategoryGroups,
  toCategoryInputs,
  toProductDetail,
  toProductSearchParams,
  toProductListItem,
  toSellerProduct,
  toSellerProductDetail,
} from './product.mapper'
import { toSellerProductsParams, type SellerProductTab } from './seller-product-tab.rules'

export const productKeys = {
  all: ['products'] as const,
  list: ['products', 'list'] as const,
  search: (search: ProductSearch, page: number) => ['products', 'list', search, page] as const,
  detail: (productId: string) => ['products', 'detail', productId] as const,
  sellerList: (tab: SellerProductTab, page: number, size: number) =>
    ['products', 'seller', 'list', tab, page, size] as const,
  sellerDetail: (productId: string) => ['products', 'seller', productId] as const,
  categories: (gender: CategoryGender | null = null) =>
    ['products', 'categories', gender ?? 'ALL'] as const,
  categoryInputs: (categoryId: string) => ['products', 'category-inputs', categoryId] as const,
}

const NO_CATEGORIES: Category[] = []

/**
 * 카테고리는 거의 바뀌지 않아 한 번만 불러온다. 고른 자녀의 성별을 주면 그 자녀에게 보일 카테고리만 받는다
 * (쇼핑 홈 · 맞춤 목록). 상품 상세의 카테고리 이름 찾기처럼 전체가 필요하면 주지 않는다
 */
export function useCategoriesQuery(gender: CategoryGender | null = null) {
  return useQuery({
    queryKey: productKeys.categories(gender),
    queryFn: () => productApi.categories(gender),
    select: (tree) => toCategories(tree),
    staleTime: Infinity,
  })
}

/** 등록 화면 2단 선택용 카테고리 묶음 (같은 트리를 한 번만 불러온다) */
export function useCategoryGroupsQuery() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: () => productApi.categories(),
    select: (tree) => toCategoryGroups(tree),
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

/** 판매 중인 상품 한 페이지 (검색어 · 카테고리, BE GET /products, page는 0부터). 페이지를 넘기는 동안 앞 페이지를 그대로 보여 준다 */
export function useProductsQuery(
  search: ProductSearch = NO_SEARCH,
  page = 0,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    enabled,
    queryKey: productKeys.search(search, page),
    queryFn: () => productApi.list(toProductSearchParams(search), page),
    select: (data: Page<ProductListItemDto>) => ({
      ...data,
      content: data.content.map(toProductListItem),
    }),
    placeholderData: keepPreviousData,
  })
}

/** isEnabled가 false면 부르지 않는다 (예: 주소에 상품이 있을 때만 읽기) */
export function useProductQuery(productId: string, isEnabled = true) {
  const categories = useCategoryList()
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => productApi.get(productId),
    select: useCallback((dto: ProductDetailDto) => toProductDetail(dto, categories), [categories]),
    enabled: isEnabled,
  })
}

/** 내 상품 한 쪽 (탭으로 서버가 거르고 쪽을 나눈다, 등록 최신순) */
export function useSellerProductsQuery(tab: SellerProductTab, page: number, size = 20) {
  return useQuery({
    queryKey: productKeys.sellerList(tab, page, size),
    queryFn: () => productApi.sellerList(toSellerProductsParams(tab, page, size)),
    select: (result) => ({ ...result, content: result.content.map(toSellerProduct) }),
    placeholderData: keepPreviousData,
  })
}

/** 탭의 전체 상품 수 (size 1 요청의 totalElements). 판매자 홈 숫자 · 상품 관리 탭 숫자가 같이 쓴다 */
export function useSellerProductCountQuery(tab: SellerProductTab) {
  return useQuery({
    queryKey: productKeys.sellerList(tab, 0, 1),
    queryFn: () => productApi.sellerList(toSellerProductsParams(tab, 0, 1)),
    select: (result) => result.totalElements,
  })
}

export function useSellerProductQuery(productId: string) {
  return useQuery({
    queryKey: productKeys.sellerDetail(productId),
    queryFn: () => productApi.sellerGet(productId),
    select: toSellerProductDetail,
  })
}

/**
 * 상품 여럿의 대표 사진 (상품 ID → 주소, 모르거나 못 읽으면 null). 조르기처럼 응답에 사진이 없는 줄에 쓴다.
 * 상품 상세와 같은 캐시를 쓴다 (판매가 끝나 상세가 없으면 null)
 */
export function useProductImageUrls(productIds: (string | null)[]): Record<string, string | null> {
  const ids = [...new Set(productIds.filter((id): id is string => !!id))]
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: productKeys.detail(id),
      queryFn: () => productApi.get(id),
      staleTime: 5 * 60_000,
      retry: false,
    })),
  })
  return Object.fromEntries(
    ids.map((id, index) => {
      const dto = results[index]?.data
      return [id, dto ? productImageUrlOf(dto) : null]
    }),
  )
}
