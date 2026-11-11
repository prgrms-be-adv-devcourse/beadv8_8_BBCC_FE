import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { recommendationApi } from '../api/recommendation-api'
import type { RecommendedProductsQuery } from './recommendation'
import { nextRecommendedPageOf, type RecommendedPageParam } from './recommended-page.rules'
import {
  toCompanionProducts,
  toHomePreview,
  toRecommendedProduct,
  toRecommendedProductsParams,
  toSizeRecommendation,
} from './recommendation.mapper'
import { toReferenceGarment } from './reference-garment.mapper'

export const recommendationKeys = {
  all: ['recommendation'] as const,
  referenceGarments: (childId: string) =>
    ['recommendation', 'reference-garments', childId] as const,
  size: (productId: string, childId: string) =>
    ['recommendation', 'size', productId, childId] as const,
  products: (childId: string, query: RecommendedProductsQuery) =>
    ['recommendation', 'products', childId, toRecommendedProductsParams(query)] as const,
  preview: (childId: string) => ['recommendation', 'preview', childId] as const,
  companions: (productId: string, childId: string) =>
    ['recommendation', 'companions', productId, childId] as const,
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

/** 홈 맛보기 4개 (AI가 자녀 맞춤 상위 20개 중에서 고르고 이유를 쓴다) */
export function useHomePreviewQuery(childId: string | null) {
  return useQuery({
    queryKey: recommendationKeys.preview(childId ?? ''),
    queryFn: () => recommendationApi.getPreview(childId!),
    select: toHomePreview,
    enabled: childId !== null,
  })
}

/**
 * 함께 사면 좋은 상품: 자녀를 골랐을 때만 부른다. AI 응답이 느려 Gateway가 504를 줄 수 있어
 * 실패해도 다시 부르지 않는다 (화면은 영역을 숨긴다)
 */
export function useCompanionProductsQuery(productId: string, childId: string | null) {
  return useQuery({
    queryKey: recommendationKeys.companions(productId, childId ?? ''),
    queryFn: () => recommendationApi.getCompanions(productId, childId!),
    select: toCompanionProducts,
    enabled: childId !== null,
    retry: false,
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

const FIRST_PAGE: RecommendedPageParam = { page: 0 }

/**
 * 맞춤 목록 화면: 「더 보기」로 다음 페이지를 이어 붙인다 (선호 점수순).
 * 1쪽은 asOf 없이 부르고, 2쪽부터 1쪽 응답의 asOf를 넘긴다. 자녀 · 카테고리가 바뀌면 키가 바뀌어 1쪽부터 다시 부른다
 */
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
        toRecommendedProductsParams({ categoryId, ...pageParam, size }),
      ),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: nextRecommendedPageOf,
    select: (data) => ({
      products: data.pages.flatMap((page) => page.content.map(toRecommendedProduct)),
      totalElements: data.pages[0]?.totalElements ?? 0,
    }),
  })
}

/** 자녀의 기준 옷 (상의 → 하의) */
export function useReferenceGarmentsQuery(childId: string) {
  return useQuery({
    queryKey: recommendationKeys.referenceGarments(childId),
    queryFn: () => recommendationApi.referenceGarments(childId),
    select: (list) => list.map(toReferenceGarment),
  })
}
