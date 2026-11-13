import { useInfiniteQuery, useQuery, type QueryFunctionContext } from '@tanstack/react-query'
import { nextPageOf, type StreamEvent } from '@/shared/api'
import { recommendationApi } from '../api/recommendation-api'
import type {
  CompanionProductsDto,
  HomePreviewDto,
  SizeRecommendationDto,
} from '../api/recommendation.dto'
import type { RecommendedProductsQuery } from './recommendation'
import { isWaitingForAi, shownPicksOf } from './recommended-picks.rules'
import { nextRecommendedPageOf, type RecommendedPageParam } from './recommended-page.rules'
import { shownSizeOf } from './size-recommendation.rules'
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

/**
 * 사이즈 추천 (SSE): 규칙 결과를 받자마자 그리고, AI 답이 오면 바꾼다. 스트림이 열려 있고 그리는 결과가 AI가 아니면 isWaitingForAi.
 * 실패해도 JSON으로 다시 부르지 않고, AI를 또 기다리므로 저절로 다시 부르지도 않는다
 */
export function useSizeRecommendationQuery(productId: string, childId: string | null) {
  const query = useQuery({
    queryKey: recommendationKeys.size(productId, childId ?? ''),
    queryFn: streamIntoCache<SizeRecommendationDto>((signal, onEvent) =>
      recommendationApi.streamSize(productId, childId!, signal, onEvent),
    ),
    select: (events) => shownSizeOf(events.map((item) => toSizeRecommendation(item.data))),
    enabled: childId !== null,
    retry: false,
  })
  return { ...query, isWaitingForAi: isWaitingForAi(query.data, query.isFetching) }
}

/** 스트림이 아무 이벤트 없이 닫히면(서버 오류) 불러오지 못한 것으로 본다 → 화면은 「다시 불러오기」 */
function requireEvents<T>(events: T[]): T[] {
  if (events.length === 0) throw new Error('추천을 불러오지 못했어요.')
  return events
}

type OpenStream<T> = (
  signal: AbortSignal,
  onEvent: (event: StreamEvent<T>) => void,
) => Promise<StreamEvent<T>[]>

/**
 * 추천 스트림(SSE) 쿼리 함수: 이벤트가 올 때마다 지금까지 받은 목록을 캐시에 넣어, 먼저 온 규칙 결과를 바로 그린다.
 * 캐시에 값이 들어가도 스트림이 닫힐 때까지 isFetching이 true라 그동안을 AI 대기 중으로 본다.
 * 다시 부를 때(오래된 캐시)는 이전에 받은 목록 뒤에 이어 붙여, 새 ai가 오기 전까지 이전 AI 결과가 규칙 결과로 덮이지 않게 한다.
 * 닫히면 이번에 받은 목록만 남긴다. 화면을 떠나면 스트림을 끊고(signal) 캐시도 부르기 전으로 되돌린다
 */
function streamIntoCache<T>(open: OpenStream<T>) {
  return async ({ signal, client, queryKey }: QueryFunctionContext): Promise<StreamEvent<T>[]> => {
    const previous = client.getQueryData<StreamEvent<T>[]>(queryKey) ?? []
    const received: StreamEvent<T>[] = []
    const events = await open(signal, (event) => {
      received.push(event)
      client.setQueryData(queryKey, [...previous, ...received])
    })
    return requireEvents(events)
  }
}

/**
 * 홈 맛보기 4개 (SSE): 규칙 결과(rule)를 받자마자 그리고, AI 답(ai)이 오면 바꾼다. 그릴 것이 없으면 null.
 * 스트림이 열려 있고 그리는 결과가 AI가 아니면 isWaitingForAi.
 * 다시 부르면 AI를 또 기다리므로 실패해도 다시 부르지 않는다
 */
export function useHomePreviewQuery(childId: string | null) {
  const query = useQuery({
    queryKey: recommendationKeys.preview(childId ?? ''),
    queryFn: streamIntoCache<HomePreviewDto>((signal, onEvent) =>
      recommendationApi.streamPreview(childId!, signal, onEvent),
    ),
    select: (events) => shownPicksOf(events.map((item) => toHomePreview(item.data))),
    enabled: childId !== null,
    retry: false,
  })
  return { ...query, isWaitingForAi: isWaitingForAi(query.data, query.isFetching) }
}

/**
 * 함께 사면 좋은 상품 (SSE): 자녀를 골랐을 때만 부른다. 홈 맛보기와 같이 규칙 결과를 먼저 그리고 AI 답으로 바꾼다.
 * 실패(401 · 504 포함)해도 저절로 다시 부르지 않는다 (화면이 안내와 「다시 불러오기」를 둔다)
 */
export function useCompanionProductsQuery(productId: string, childId: string | null) {
  const query = useQuery({
    queryKey: recommendationKeys.companions(productId, childId ?? ''),
    queryFn: streamIntoCache<CompanionProductsDto>((signal, onEvent) =>
      recommendationApi.streamCompanions(productId, childId!, signal, onEvent),
    ),
    select: (events) => shownPicksOf(events.map((item) => toCompanionProducts(item.data))),
    enabled: childId !== null,
    retry: false,
  })
  return { ...query, isWaitingForAi: isWaitingForAi(query.data, query.isFetching) }
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
