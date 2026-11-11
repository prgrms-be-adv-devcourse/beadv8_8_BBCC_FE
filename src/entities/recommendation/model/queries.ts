import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { nextPageOf } from '@/shared/api'
import { recommendationApi } from '../api/recommendation-api'
import type { RecommendedProductsQuery } from './recommendation'
import { shownPicksOf } from './recommended-picks.rules'
import { nextRecommendedPageOf, type RecommendedPageParam } from './recommended-page.rules'
import {
  toCompanionProducts,
  toHomePreview,
  toRecommendedProduct,
  toRecommendedProductsParams,
  toSizeRecommendation,
} from './recommendation.mapper'
import { toPurchasedGarment } from './purchased-garment.mapper'
import { toReferenceGarment } from './reference-garment.mapper'

export const recommendationKeys = {
  all: ['recommendation'] as const,
  referenceGarments: (childId: string) =>
    ['recommendation', 'reference-garments', childId] as const,
  purchases: (childId: string) => ['recommendation', 'purchases', childId] as const,
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

/** 스트림이 아무 이벤트 없이 닫히면(서버 오류) 불러오지 못한 것으로 본다 → 화면은 「다시 불러오기」 */
function requireEvents<T>(events: T[]): T[] {
  if (events.length === 0) throw new Error('추천을 불러오지 못했어요.')
  return events
}

/**
 * 홈 맛보기 4개 (SSE): 스트림이 닫힐 때까지 기다려 AI 답, 없으면 규칙 결과를 돌려준다. 그릴 것이 없으면 null.
 * 다시 부르면 AI를 또 기다리므로 실패해도 다시 부르지 않는다. 화면을 떠나면 스트림을 끊는다(signal)
 */
export function useHomePreviewQuery(childId: string | null) {
  return useQuery({
    queryKey: recommendationKeys.preview(childId ?? ''),
    queryFn: ({ signal }) => recommendationApi.streamPreview(childId!, signal).then(requireEvents),
    select: (events) => shownPicksOf(events.map((item) => toHomePreview(item.data))),
    enabled: childId !== null,
    retry: false,
  })
}

/**
 * 함께 사면 좋은 상품 (SSE): 자녀를 골랐을 때만 부른다. 홈 맛보기와 같이 닫힐 때까지 모아 그릴 결과를 고른다.
 * 실패(401 · 504 포함)해도 저절로 다시 부르지 않는다 (화면이 안내와 「다시 불러오기」를 둔다)
 */
export function useCompanionProductsQuery(productId: string, childId: string | null) {
  return useQuery({
    queryKey: recommendationKeys.companions(productId, childId ?? ''),
    queryFn: ({ signal }) =>
      recommendationApi.streamCompanions(productId, childId!, signal).then(requireEvents),
    select: (events) => shownPicksOf(events.map((item) => toCompanionProducts(item.data))),
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

/** 자녀의 기준 옷 (상의 → 하의). 자녀를 고르지 않았으면(null) 부르지 않는다 */
export function useReferenceGarmentsQuery(childId: string | null) {
  return useQuery({
    queryKey: recommendationKeys.referenceGarments(childId ?? ''),
    queryFn: () => recommendationApi.referenceGarments(childId ?? ''),
    select: (list) => list.map(toReferenceGarment),
    enabled: childId !== null,
  })
}

/** 자녀에게 산 옷 (구매확정, 확정이 늦은 순서): 「더 보기」로 다음 페이지를 이어 붙인다 */
export function usePurchasedGarmentsInfiniteQuery(childId: string, size = 10) {
  return useInfiniteQuery({
    queryKey: recommendationKeys.purchases(childId),
    queryFn: ({ pageParam }) =>
      recommendationApi.purchasedGarments(childId, { page: pageParam, size }),
    initialPageParam: 0,
    getNextPageParam: nextPageOf,
    select: (data) => ({
      garments: data.pages.flatMap((page) => page.content.map(toPurchasedGarment)),
      totalElements: data.pages[0]?.totalElements ?? 0,
    }),
  })
}
