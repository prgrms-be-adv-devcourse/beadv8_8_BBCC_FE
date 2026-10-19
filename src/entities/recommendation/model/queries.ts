import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { nextPageOf } from '@/shared/api'
import { recommendationApi } from '../api/recommendation-api'
import type { RecommendedProductsQuery } from './recommendation'
import {
  toRecommendedProduct,
  toRecommendedProductsParams,
  toSizeRecommendation,
} from './recommendation.mapper'

const recommendationKeys = {
  size: (productId: string, childId: string) =>
    ['recommendation', 'size', productId, childId] as const,
  products: (childId: string, query: RecommendedProductsQuery) =>
    ['recommendation', 'products', childId, toRecommendedProductsParams(query)] as const,
  more: (childId: string, categoryId: string | null) =>
    ['recommendation', 'more', childId, categoryId] as const,
}

export function useSizeRecommendationQuery(productId: string, childId: string | null) {
  return useQuery({
    queryKey: recommendationKeys.size(productId, childId ?? ''),
    queryFn: () => recommendationApi.getSize(productId, childId!),
    select: toSizeRecommendation,
    enabled: childId !== null,
  })
}

/** 맞춤 목록 한 페이지 (홈 맛보기 · 시연 콘솔). 조건을 주지 않으면 첫 20개 */
export function useRecommendedProductsQuery(
  childId: string | null,
  query: RecommendedProductsQuery = {},
) {
  return useQuery({
    queryKey: recommendationKeys.products(childId ?? '', query),
    queryFn: () => recommendationApi.getProducts(childId!, toRecommendedProductsParams(query)),
    select: (page) => ({ ...page, content: page.content.map(toRecommendedProduct) }),
    enabled: childId !== null,
  })
}

/** 맞춤 목록 화면: 「더 보기」로 다음 페이지를 이어 붙인다 (신상품순 고정) */
export function useRecommendedProductsInfiniteQuery(
  childId: string,
  categoryId: string | null,
  size = 20,
) {
  return useInfiniteQuery({
    queryKey: recommendationKeys.more(childId, categoryId),
    queryFn: ({ pageParam }) =>
      recommendationApi.getProducts(
        childId,
        toRecommendedProductsParams({ categoryId, page: pageParam, size }),
      ),
    initialPageParam: 0,
    getNextPageParam: nextPageOf,
    select: (data) => ({
      products: data.pages.flatMap((page) => page.content.map(toRecommendedProduct)),
      totalElements: data.pages[0]?.totalElements ?? 0,
    }),
  })
}
